[**@hanseltime/pulumi-linux-iptables**](../README.md)

***

[@hanseltime/pulumi-linux-iptables](../README.md) / IpSet

# Class: IpSet\<CreateOptions, EntryAddOptions\>

Helpful utility class for programmatically representing ipsets.

This class does not create any resources.  Rather, it tracks the entries add to it via (add)
and can then be used to generate the create and add commands.

Ideally, you should be using this to generate a new set and then swap them on changes.

Example:

const bannedSet = IpSet.HashIp('BANNED_IPS', { family: 'inet' }).add({ ip: '44.44.44.44' }).add({ ip: '120.12.0.0/16' })

// Do something with this string
bannedSet.createCommand()
// Do something with the add commands
bannedSet.addCommands()

## Type Parameters

### CreateOptions

`CreateOptions` *extends* [`CreateInterfaces`](../type-aliases/CreateInterfaces.md)

### EntryAddOptions

`EntryAddOptions` *extends* [`EntryAddInterfaces`](../type-aliases/EntryAddInterfaces.md)

## Constructors

### Constructor

> **new IpSet**\<`CreateOptions`, `EntryAddOptions`\>(`name`, `createOptions`): `IpSet`\<`CreateOptions`, `EntryAddOptions`\>

#### Parameters

##### name

`string`

##### createOptions

`CreateOptions`

#### Returns

`IpSet`\<`CreateOptions`, `EntryAddOptions`\>

## Properties

### createOptions

> `readonly` **createOptions**: `CreateOptions`

***

### entries

> `readonly` **entries**: `EntryAddOptions`[] = `[]`

***

### name

> `readonly` **name**: `string`

***

### numComponents

> `readonly` **numComponents**: `number`

## Methods

### add()

> **add**(`entry`): `IpSet`\<`CreateOptions`, `EntryAddOptions`\>

#### Parameters

##### entry

`EntryAddOptions`

#### Returns

`IpSet`\<`CreateOptions`, `EntryAddOptions`\>

***

### addCommands()

> **addCommands**(`postfix`): `string`[]

Generates an array of commands to add the ipset entries to the named ipset

#### Parameters

##### postfix

`string` = `""`

#### Returns

`string`[]

***

### changeSignature()

> **changeSignature**(): `string`

This is just used for detecting changes - right now it's super large

#### Returns

`string`

***

### createCommand()

> **createCommand**(`postfix`): `string`

Generates the commands for createing this IP set

#### Parameters

##### postfix

`string` = `""`

supplied if you're trying to create a swappable ipset

#### Returns

`string`

***

### matchArgs()

> **matchArgs**(`flags`): `string`

Creates the match args string for the given flags

Must match the number options for the structure hash:net,net should have 2 to evaluate src,dst

#### Parameters

##### flags

(`"src"` \| `"dst"`)[]

#### Returns

`string`

***

### BitMapIp()

> `static` **BitMapIp**(`name`, `createOptions`): `IpSet`\<[`BitMapIpCreate`](../interfaces/BitMapIpCreate.md), [`BitMapIpEntryAdd`](../interfaces/BitMapIpEntryAdd.md)\>

#### Parameters

##### name

`string`

##### createOptions

`Omit`\<[`BitMapIpCreate`](../interfaces/BitMapIpCreate.md), `"setType"`\>

#### Returns

`IpSet`\<[`BitMapIpCreate`](../interfaces/BitMapIpCreate.md), [`BitMapIpEntryAdd`](../interfaces/BitMapIpEntryAdd.md)\>

***

### BitMapIpMac()

> `static` **BitMapIpMac**(`name`, `createOptions`): `IpSet`\<[`BitMapIpMacCreate`](../interfaces/BitMapIpMacCreate.md), [`BitMapIpMacEntryAdd`](../interfaces/BitMapIpMacEntryAdd.md)\>

#### Parameters

##### name

`string`

##### createOptions

`Omit`\<[`BitMapIpMacCreate`](../interfaces/BitMapIpMacCreate.md), `"setType"`\>

#### Returns

`IpSet`\<[`BitMapIpMacCreate`](../interfaces/BitMapIpMacCreate.md), [`BitMapIpMacEntryAdd`](../interfaces/BitMapIpMacEntryAdd.md)\>

***

### BitMapPort()

> `static` **BitMapPort**(`name`, `createOptions`): `IpSet`\<[`BitMapPortCreate`](../interfaces/BitMapPortCreate.md), [`BitMapPortEntryAdd`](../interfaces/BitMapPortEntryAdd.md)\>

#### Parameters

##### name

`string`

##### createOptions

`Omit`\<[`BitMapPortCreate`](../interfaces/BitMapPortCreate.md), `"setType"`\>

#### Returns

`IpSet`\<[`BitMapPortCreate`](../interfaces/BitMapPortCreate.md), [`BitMapPortEntryAdd`](../interfaces/BitMapPortEntryAdd.md)\>

***

### HashIp()

> `static` **HashIp**(`name`, `createOptions`): `IpSet`\<[`HashIpCreate`](../interfaces/HashIpCreate.md), [`HashIpEntryAdd`](../interfaces/HashIpEntryAdd.md)\>

#### Parameters

##### name

`string`

##### createOptions

`Omit`\<[`HashIpCreate`](../interfaces/HashIpCreate.md), `"setType"`\>

#### Returns

`IpSet`\<[`HashIpCreate`](../interfaces/HashIpCreate.md), [`HashIpEntryAdd`](../interfaces/HashIpEntryAdd.md)\>

***

### HashIpMac()

> `static` **HashIpMac**(`name`, `createOptions`): `IpSet`\<[`HashIpMacCreate`](../interfaces/HashIpMacCreate.md), [`HashIpMacEntryAdd`](../interfaces/HashIpMacEntryAdd.md)\>

#### Parameters

##### name

`string`

##### createOptions

`Omit`\<[`HashIpMacCreate`](../interfaces/HashIpMacCreate.md), `"setType"`\>

#### Returns

`IpSet`\<[`HashIpMacCreate`](../interfaces/HashIpMacCreate.md), [`HashIpMacEntryAdd`](../interfaces/HashIpMacEntryAdd.md)\>

***

### HashIpMark()

> `static` **HashIpMark**(`name`, `createOptions`): `IpSet`\<[`HashIpMarkCreate`](../interfaces/HashIpMarkCreate.md), [`HashIpMarkEntryAdd`](../interfaces/HashIpMarkEntryAdd.md)\>

#### Parameters

##### name

`string`

##### createOptions

`Omit`\<[`HashIpMarkCreate`](../interfaces/HashIpMarkCreate.md), `"setType"`\>

#### Returns

`IpSet`\<[`HashIpMarkCreate`](../interfaces/HashIpMarkCreate.md), [`HashIpMarkEntryAdd`](../interfaces/HashIpMarkEntryAdd.md)\>

***

### HashIpPort()

> `static` **HashIpPort**(`name`, `createOptions`): `IpSet`\<[`HashIpPortCreate`](../interfaces/HashIpPortCreate.md), [`HashIpPortEntryAdd`](../interfaces/HashIpPortEntryAdd.md)\>

#### Parameters

##### name

`string`

##### createOptions

`Omit`\<[`HashIpPortCreate`](../interfaces/HashIpPortCreate.md), `"setType"`\>

#### Returns

`IpSet`\<[`HashIpPortCreate`](../interfaces/HashIpPortCreate.md), [`HashIpPortEntryAdd`](../interfaces/HashIpPortEntryAdd.md)\>

***

### HashIpPortIp()

> `static` **HashIpPortIp**(`name`, `createOptions`): `IpSet`\<[`HashIpPortIpCreate`](../interfaces/HashIpPortIpCreate.md), [`HashIpPortIpEntryAdd`](../interfaces/HashIpPortIpEntryAdd.md)\>

#### Parameters

##### name

`string`

##### createOptions

`Omit`\<[`HashIpPortIpCreate`](../interfaces/HashIpPortIpCreate.md), `"setType"`\>

#### Returns

`IpSet`\<[`HashIpPortIpCreate`](../interfaces/HashIpPortIpCreate.md), [`HashIpPortIpEntryAdd`](../interfaces/HashIpPortIpEntryAdd.md)\>

***

### HashIpPortNet()

> `static` **HashIpPortNet**(`name`, `createOptions`): `IpSet`\<[`HashIpPortNetCreate`](../interfaces/HashIpPortNetCreate.md), [`HashIpPortNetEntryAdd`](../interfaces/HashIpPortNetEntryAdd.md)\>

#### Parameters

##### name

`string`

##### createOptions

`Omit`\<[`HashIpPortNetCreate`](../interfaces/HashIpPortNetCreate.md), `"setType"`\>

#### Returns

`IpSet`\<[`HashIpPortNetCreate`](../interfaces/HashIpPortNetCreate.md), [`HashIpPortNetEntryAdd`](../interfaces/HashIpPortNetEntryAdd.md)\>

***

### HashMac()

> `static` **HashMac**(`name`, `createOptions`): `IpSet`\<[`HashMacCreate`](../interfaces/HashMacCreate.md), [`HashMacEntryAdd`](../interfaces/HashMacEntryAdd.md)\>

#### Parameters

##### name

`string`

##### createOptions

`Omit`\<[`HashMacCreate`](../interfaces/HashMacCreate.md), `"setType"`\>

#### Returns

`IpSet`\<[`HashMacCreate`](../interfaces/HashMacCreate.md), [`HashMacEntryAdd`](../interfaces/HashMacEntryAdd.md)\>

***

### HashNet()

> `static` **HashNet**(`name`, `createOptions`): `IpSet`\<[`HashNetCreate`](../interfaces/HashNetCreate.md), [`HashNetEntryAdd`](../interfaces/HashNetEntryAdd.md)\>

#### Parameters

##### name

`string`

##### createOptions

`Omit`\<[`HashNetCreate`](../interfaces/HashNetCreate.md), `"setType"`\>

#### Returns

`IpSet`\<[`HashNetCreate`](../interfaces/HashNetCreate.md), [`HashNetEntryAdd`](../interfaces/HashNetEntryAdd.md)\>

***

### HashNetIface()

> `static` **HashNetIface**(`name`, `createOptions`): `IpSet`\<[`HashNetIfaceCreate`](../interfaces/HashNetIfaceCreate.md), [`HashNetIfaceEntryAdd`](../interfaces/HashNetIfaceEntryAdd.md)\>

#### Parameters

##### name

`string`

##### createOptions

`Omit`\<[`HashNetIfaceCreate`](../interfaces/HashNetIfaceCreate.md), `"setType"`\>

#### Returns

`IpSet`\<[`HashNetIfaceCreate`](../interfaces/HashNetIfaceCreate.md), [`HashNetIfaceEntryAdd`](../interfaces/HashNetIfaceEntryAdd.md)\>

***

### HashNetNet()

> `static` **HashNetNet**(`name`, `createOptions`): `IpSet`\<[`HashNetNetCreate`](../interfaces/HashNetNetCreate.md), [`HashNetNetEntryAdd`](../interfaces/HashNetNetEntryAdd.md)\>

#### Parameters

##### name

`string`

##### createOptions

`Omit`\<[`HashNetNetCreate`](../interfaces/HashNetNetCreate.md), `"setType"`\>

#### Returns

`IpSet`\<[`HashNetNetCreate`](../interfaces/HashNetNetCreate.md), [`HashNetNetEntryAdd`](../interfaces/HashNetNetEntryAdd.md)\>

***

### HashNetPort()

> `static` **HashNetPort**(`name`, `createOptions`): `IpSet`\<[`HashNetPortCreate`](../interfaces/HashNetPortCreate.md), [`HashNetPortEntryAdd`](../interfaces/HashNetPortEntryAdd.md)\>

#### Parameters

##### name

`string`

##### createOptions

`Omit`\<[`HashNetPortCreate`](../interfaces/HashNetPortCreate.md), `"setType"`\>

#### Returns

`IpSet`\<[`HashNetPortCreate`](../interfaces/HashNetPortCreate.md), [`HashNetPortEntryAdd`](../interfaces/HashNetPortEntryAdd.md)\>

***

### HashNetPortNet()

> `static` **HashNetPortNet**(`name`, `createOptions`): `IpSet`\<[`HashNetPortNetCreate`](../interfaces/HashNetPortNetCreate.md), [`HashNetPortNetEntryAdd`](../interfaces/HashNetPortNetEntryAdd.md)\>

#### Parameters

##### name

`string`

##### createOptions

`Omit`\<[`HashNetPortNetCreate`](../interfaces/HashNetPortNetCreate.md), `"setType"`\>

#### Returns

`IpSet`\<[`HashNetPortNetCreate`](../interfaces/HashNetPortNetCreate.md), [`HashNetPortNetEntryAdd`](../interfaces/HashNetPortNetEntryAdd.md)\>

***

### ListSet()

> `static` **ListSet**(`name`, `createOptions`): `IpSet`\<[`ListSetCreate`](../interfaces/ListSetCreate.md), [`ListSetEntryAdd`](../interfaces/ListSetEntryAdd.md)\>

#### Parameters

##### name

`string`

##### createOptions

`Omit`\<[`ListSetCreate`](../interfaces/ListSetCreate.md), `"setType"`\>

#### Returns

`IpSet`\<[`ListSetCreate`](../interfaces/ListSetCreate.md), [`ListSetEntryAdd`](../interfaces/ListSetEntryAdd.md)\>
