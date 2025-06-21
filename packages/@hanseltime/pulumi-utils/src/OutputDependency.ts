import * as pulumi from "@pulumi/pulumi";

type PulumiResource<T = any> = new (
	name: string,
	inputs: pulumi.Inputs,
	opts: pulumi.CustomResourceOptions,
) => T;

interface OutputDependencyArgs<Cat extends string = string> {
	/**
	 * This is the output that the resource will make sure is resolved before other resources that rely on it will be called.
	 */
	output: pulumi.Output<any>;

	/**
	 * A token that you can add to create sets of categories of "runtime dependencies".  This is helpful
	 * mainly if you want to create a set of global checks that should be run before anything else.
	 *
	 * You can use this in conjunction with the "DependsOn" static method to wrap constructors so that they make sure to depend on
	 * every input created in this category
	 */
	category?: Cat;
}

/**
 * This is a resource implementation for outputs that might need to resolve a value from a previous resource before
 * going onto other resources.
 *
 * An example of this would be performing a validation check on some resource before creating another resource.
 * This is ideal if you're trying to verify something that an API call only creates after starting but before having more
 * resources set up that would need to be removed if that thing wasn't there.
 *
 * You can do so via:
 *
 * const check = new OutputDependency('uniqueName', {
 *    output: someResource.name.apply((n) => {
 *      if (n.startsWith('badPrefix')) {
 *          // Return an error that we will throw when this resource runs
 *          return throw new Error(`Cannot work with badPrefix name: ${n}`)
 *      }
 *    })
 * })
 *
 * new MyResource('name', args, {
 *   dependsOn: [
 *      check,
 *   ]
 * })
 *
 * Or you can add a category that you can require in the dependsOn wrapper!  Note, there are some caveats
 * here where you will have to ensure that you do not add new resources to the category after creating a dependency
 * since the use of constructors (and pulumi's underlying grpc server backend means that we can't lazily add dependencies).
 *
 * const MyResourceWrapped = OutputDependency.dependsOn(MyResource, ['categoryA'])
 *
 * const new MyResourceWrapped('name', args, {
 *   dependsOn: [
 *      check,
 *   ]
 * })
 */
export class OutputDependency<
	Cat extends string = string,
> extends pulumi.ComponentResource {
	static readonly dependencyCategories = new Map<string, OutputDependency[]>();
	/**
	 * A record of the tokens of ('Class:name') instances that have claim dependency on the categories
	 *
	 * This is used to makes sure that we are ONLY claiming categories after that category has been fully created.
	 */
	static readonly categoryClaims = new Map<string, string[]>();

	/**
	 * Map of type signature classes to the wrapped classes.  This ensures we don't just create
	 * a bunch of non-comparable instance types
	 */
	static readonly wrapMap = new Map<
		PulumiResource,
		{
			catStr: string;
			resource: PulumiResource;
		}[]
	>();

	private static getCategoryDependency(cat: string): OutputDependency[] {
		if (!OutputDependency.dependencyCategories.has(cat)) {
			throw new Error(
				`Attempting to get Category ${cat} Dependencies but none registered as of creation of the current resource. (Check stack trace)`,
			);
		}

		return OutputDependency.dependencyCategories.get(cat)!;
	}

	private static registerCategoryDependency(
		cat: string,
		dep: OutputDependency,
	) {
		const claims = OutputDependency.categoryClaims.get(cat);
		if (claims && claims.length > 0) {
			throw new Error(
				`Attempting to create a dependency resource for category (${cat}) after having set up resources that already depend on it: ${claims.join(",")}`,
			);
		}

		const deps = OutputDependency.dependencyCategories.get(cat);
		if (!deps) {
			OutputDependency.dependencyCategories.set(cat, [dep]);
		} else {
			deps.push(dep);
		}
	}

	static dependsOn<
		T,
		I extends pulumi.Inputs,
		O extends pulumi.CustomResourceOptions,
	>(cls: new (name: string, inputs: I, opts: O) => T, categories: string[]) {
		const catStr = categories.join(",");

		if (OutputDependency.wrapMap.has(cls as PulumiResource)) {
			const wrapInfos = OutputDependency.wrapMap.get(cls as PulumiResource)!;
			const wrapInfo = wrapInfos.find((info) => info.catStr === catStr);
			if (wrapInfo) {
				return wrapInfo.resource;
			}
		}

		//which returns a constructor
		const ext = (name: string, inputs: I, opts: O) => {
			const dependencies = categories.reduce((deps, category) => {
				deps.push(...OutputDependency.getCategoryDependency(category));
				return deps;
			}, [] as OutputDependency[]);

			// Merge the dependsOn value with our dependencies
			const dependsOn = opts.dependsOn
				? pulumi.output(opts.dependsOn).apply((deps) => {
						if (Array.isArray(deps)) {
							return [...deps, ...dependencies];
						}
						return {
							deps,
							...dependencies,
						};
					})
				: dependencies;

			// that calls the parent constructor with itself as scope
			cls.apply(OutputDependency as any, [
				name,
				inputs,
				{
					...opts,
					dependsOn,
				},
			]);

			// Claim the category since we want to make sure people aren't adding late to categories (since the grpc server seems to be constructor
			// based and not lazy updated)
			categories.forEach((category) => {
				const claims = OutputDependency.categoryClaims.get(category);
				if (!claims) {
					OutputDependency.categoryClaims.set(category, [
						`${cls.name}:${name}`,
					]);
				} else {
					claims.push(`${cls.name}:${name}`);
				}
			});
		};

		//make the prototype an instance of the old class
		ext.prototype = Object.create(cls.prototype);

		if (OutputDependency.wrapMap.has(cls as PulumiResource)) {
			OutputDependency.wrapMap.get(cls as PulumiResource)!.push({
				catStr,
				resource: ext as unknown as PulumiResource,
			});
		} else {
			OutputDependency.wrapMap.set(cls as PulumiResource, [
				{
					catStr,
					resource: ext as unknown as PulumiResource,
				},
			]);
		}

		return ext;
	}

	constructor(
		name: string,
		props: OutputDependencyArgs<Cat>,
		opts?: pulumi.ComponentResourceOptions,
	) {
		super("hanseltime:synthetic:outputdependency", name, props, opts);

		if (props.category) {
			OutputDependency.registerCategoryDependency(props.category, this);
		}
	}
}
