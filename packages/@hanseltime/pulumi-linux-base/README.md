# @hanseltime/pulumi-linux-base

[Raw docs](./docs/)

[TODO - put your Github Pages url here](TODO)

This is a typescript library used to support other packages that you are more likely to use.  In general, the functions
and classes are DRY structures that help avoid repeating logic.

```shell
# yarn
yarn add @hanseltime/pulumi-linux-base @pulumi/pulumi
# npm
npm install @hanseltime/pulumi-linux-base @pulumi/pulumi
```

# Programmatic API

## shellStrings

The shellStrings object exposes a set of functions that can be used to create different shell strings that we've found
repetitious.  In general, all shell strings should make use of `&&` chaining and should not terminate in a way that they
cannot be chained via `&&` with another shell command.

Please take a look at the functions if you would like to understand them better.

### asSudoOutput

One of the most useful shell strings is the `asSudoOutput` function.  This will wrap your normal commands in a `sudo bash -c`
command with more strict failure flags set.  This allows you to ensure that all of the command supplied is run under sudo
privilegs without having to add sudo to all lines of a shell string.

```typescript
shellStrings.asSudoOutput(pulumi.output(args.someRootFile).apply((rootFile) => `cat ${rootFile}`))
```

In the above snippet, we are pretending that someone is supplying a `pulumi.Input<string>` of a root file that we 
want to cat.  We have to turn it into an output to work with the string, and we primarily just want to make a `cat`
command.  Now, if you were only running this command under root, you wouldn't think about sudo, but to accommadate 
the existence of an automation user that can assume sudo but is not root itself, you really want to wrap that small
call in a whole sudo call `shellStrings.asSudoOutput`.  This way, if you ever make the switch to disallowing root
over ssh, you're commands are still compatible with a user that can assume sudo without a password (See LinuxUser for
`@hanseltime/pulummi-linux` for more details) 

## StrictACL

This class can be used to declare a file or directory ACL that is entirely controlled by the resultant command.

The term `entirely` means that the ACL will be applied so that ONLY the permitted parties are given the requisite
access and that rather than an `append`, the acl will be completely reset via the setCommand if you were to call it.

This is helpful so that you can't end up having dangling ACLs on directories since they tend to be less at the forefront
of thought when checking permissions on linux.

Keep in mind that ACLs are best used when you need multi-user permissioning, and if you can simply chown a folder instead,
that is allowed.  Where this might not work would be with remapped docker users that need access to a few folders that were uploaded on their behalf by root, for instance.  In that case, we don't want to add remapped users to a root group, and
really just want to add an acl for their userId to also let them read it.

### Example

The StrictACL is not a pulumi resource in and of itself.  It is mainly a helper to generate the appropriate shell commands:

```typescript
// This would be an ACL tha  
const acl = new StrictACL(
    '/some/directory',
    [{
        id: myRemappedUid,
        permissions: [
            ACLPermissions.ExecuteOnlyOnDir,
            ACLPermissions.Read,
        ],
        type: "user",
    }],
);

new remote.Command('applyacl', {
    create: shellStrings.asSudoOutput(acl.setCommand()),
    delete: shellStrings.asSudoOutput(acl.removeCommand()),
})

```

In the above, we created an acl that only allowed the `myremappedUid` we expected to read the directory.  Then
we set up a remote Command that would always set (overriding any additional ACLS not in this declaration) when
the command was created or updated.  We also added a delete commmand so that the ACLs would not stick around if
we got rid of this command as well.

Note, the strict ACL command also sets up default behavior so that any new files created within a folder will
have the ACLs applied as well.

