# @hanseltime/pulumi-utils

[Raw docs](./docs/)

This is a package that exposes somme helpful utility methods for working with pulumi outputs (in typescript).
Primarily, this package provides a standard interface for depending on outputs so that you keep some standard
ways of identifying "api checks and operations" that we want to run before making/updating/deleting resources.

Note: in the longer term, ideally, pulumi solves these issues via their grpc interface (extending these functionalities
to all languages).  This package is a typescript solution that ideally should be unncessary as pulumi moves forward.

## Resources

### OutputDependency

One of the biggest pain points in pulumi's interface is the fact that you may have an operation or resolution that you want to
perform before actually allowing a resource to be made.  However, dependencies on outputs are only created when using a `pulumi.Input` in the
`args` argument for a resource.  That means that you would have to chain outputs that are unrelated.  For instance, if you wanted to jsut verify that a
repo name resolved to some allowed value, you would need to find an input and talk it on.

```typescript
const myS3Bucket = new aws.s3.Bucket('bucket', {
    bucketName: myRepo.name.apply((repoName) => {
        if (repoName.startsWith('badPrefix')) {
            throw new Error('Whoa you cannot make a bucket until your repo name is fixed: ' + repoName)
        }
        // Otherwise return the real bucket name
        return 'myBucketName'
    })
})
```

You can see from the above, that we are basically muddying the understanding of what that bucket's name is because we have to arbitrarily pick
an input, turn it into an output and remember to return the real value we wanted all along after doing other things.  This also gets a lot harder
if we want to say, check this prefix before multiple resources, leading to further unclear bloat in the apparent code.

To solve this, we turn to the resource dependencies part of Resource options, since pulumi will make sure to build resources in a dependency order.
This way, you can create an output, map it to a resource, and then add that resource as a dependency where it naturally makes sense.

```typescript
const myRepoCheck = new OutputDependency('repoResourceCheck', {
    outputs: [
        myRepo.name.apply((repoName) => {
            if (repoName.startsWith('badPrefix')) {
                throw new Error('Whoa you cannot make a bucket until your repo name is fixed: ' + repoName)
            }
        })
    ]
})

const myS3Bucket = new aws.s3.Bucket('bucket', {
    bucketName: return 'myBucketName'
}, {
    // Now we know that this bucket always requires us to check myRepo before applying things
    dependsOn: [
        myRepoCheck,
    ]
})

```

Please note that the above example is contrived for the sake of simplicity.  Some things that you may want to do this for might include:

1. Checking to see if certain volatile APIs are up before creating resources that would need to be torn down if they failed half-way.
2. Throwing descriptive errors after resolving some sort of pulumi output (because a regular error wouldn't be helpful without that propetry called out)


#### Categories (Finnicky)

One additional way that you can do some dependency management here would be to make use of the optional `categories` field in `OutputDependency`.
When you use a category, you are essentially grouping every outputDependency that you make into a bucket that you can then wrap Resources to depend on
via `OutputDependency.dependsOn()`.

As an example:

```typescript
const myRepoCheck = new OutputDependency('repoResourceCheck', {
    outputs: [
        myRepo.name.apply((repoName) => {
            if (repoName.startsWith('badPrefix')) {
                throw new Error('Whoa you cannot make a bucket until your repo name is fixed: ' + repoName)
            }
        })
    ],
    category: 'repoChecks',
})

const myRepoCheck2 = new OutputDependency('repoResourceCheck', {
    outputs: [
        myRepo2.name.apply((repoName) => {
            if (repoName.startsWith('badPrefix')) {
                throw new Error('Whoa you cannot make a bucket until your repo name is fixed: ' + repoName)
            }
        })
    ],
    category: 'repoChecks',
})

const myS3Bucket = new OutputDependency.dependsOn(aws.s3.Bucket, ['repoChecks'])('bucket', {
    bucketName: return 'myBucketName'
}))

```

In the example code, we have wrapped out S3 bucket constructor to require any 'repoChecks' category output dependencies and then invoked the constructor
just like we would've for `aws.s3.Bucket`.

__Important Note 1:__ Since we are dealing with constructors, category dependencies will throw an error if you end up adding another OutputDependency after
having already created a resource that depends on the category.  This is because we can't go back and lazily add the new dependency.

__Important Note 2:__ While this is an appealing option, it does obfuscate dependencies.  We provide this though, in the event that you find yourself having too many output dependencies.  We encourage you to try this only as a last option due to the fact that it has implicit time ordering that will throw errors
for people unfamiliar with the need to declare all categories first.
