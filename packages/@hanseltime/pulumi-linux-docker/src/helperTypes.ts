import * as pulumi from "@pulumi/pulumi";

export type Inputify<T> = T extends Function
	? T
	: T extends Array<infer U>
		? pulumi.Input<Inputify<U>[]>
		: T extends object
			? { [K in keyof T]: pulumi.Input<Inputify<T[K]>> }
			: pulumi.Input<T>;

export type PropsInputify<T> = {
	[K in keyof T]: Inputify<T[K]>;
};
