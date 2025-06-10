[**@hanseltime/pulumi-linux-iptables**](../README.md)

***

[@hanseltime/pulumi-linux-iptables](../README.md) / SetTypes

# Enumeration: SetTypes

## Enumeration Members

### BitmapIp

> **BitmapIp**: `"bitmap:ip"`

The bitmap:ip set type uses a memory range to store either IPv4 host (default) or IPv4 network addresses. A bitmap:ip type of set can store up to 65536 entries.

***

### BitmapIpMac

> **BitmapIpMac**: `"bitmap:ip,mac"`

The bitmap:ip,mac set type uses a memory range to store IPv4 and a MAC address pairs. A bitmap:ip,mac type of set can store up to 65536 entries.

***

### BitmapPort

> **BitmapPort**: `"bitmap:port"`

The bitmap:port set type uses a memory range to store port numbers and such a set can store up to 65536 ports.

***

### HashIp

> **HashIp**: `"hash:ip"`

The hash:ip set type uses a hash to store IP host addresses (default) or network addresses. Zero valued IP address cannot be stored in a hash:ip type of set.

***

### HashIpMac

> **HashIpMac**: `"hash:ip,mac"`

The hash:ip,mac set type uses a hash to store IP and a MAC address pairs. Zero valued MAC addresses cannot be stored in a hash:ip,mac type of set. For matches on destination MAC addresses, see COMMENTS below.

***

### HashIpMark

> **HashIpMark**: `"hash:ip,mark"`

The hash:ip,mark set type uses a hash to store IP address and packet mark pairs.

***

### HashIpPort

> **HashIpPort**: `"hash:ip,port"`

The hash:ip,port set type uses a hash to store IP address and port number pairs. The port number is interpreted together with a protocol (default TCP) and zero protocol number cannot be used.

***

### HashIpPortIp

> **HashIpPortIp**: `"hash:ip,port,ip"`

The hash:ip,port,ip set type uses a hash to store IP address, port number and a second IP address triples. The port number is interpreted together with a protocol (default TCP) and zero protocol number cannot be used.

***

### HashIpPortNet

> **HashIpPortNet**: `"hash:ip,port,net"`

The hash:ip,port,net set type uses a hash to store IP address, port number and IP network address triples. The port number is interpreted together with a protocol (default TCP) and zero protocol number cannot be used. Network address with zero prefix size cannot be stored either.

***

### HashMac

> **HashMac**: `"hash:mac"`

The hash:mac set type uses a hash to store MAC addresses. Zero valued MAC addresses cannot be stored in a hash:mac type of set. For matches on destination MAC addresses, see COMMENTS below.

***

### HashNet

> **HashNet**: `"hash:net"`

The hash:net set type uses a hash to store different sized IP network addresses. Network address with zero prefix size cannot be stored in this type of sets.

***

### HashNetIface

> **HashNetIface**: `"hash:net,iface"`

The hash:net,iface set type uses a hash to store different sized IP network address and interface name pairs.

***

### HashNetNet

> **HashNetNet**: `"hash:net,net"`

The hash:net,net set type uses a hash to store pairs of different sized IP network addresses. Bear in mind that the first parameter has precedence over the second, so a nomatch entry could be potentially be ineffective if a more specific first parameter existed with a suitable second parameter. Network address with zero prefix size cannot be stored in this type of set.

***

### HashNetPort

> **HashNetPort**: `"hash:net,port"`

The hash:ip,port set type uses a hash to store IP address and port number pairs. The port number is interpreted together with a protocol (default TCP) and zero protocol number cannot be used.

***

### HashNetPortNet

> **HashNetPortNet**: `"hash:net,port,net"`

The hash:net,port,net set type behaves similarly to hash:ip,port,net but accepts a cidr value for both the first and last parameter. Either subnet is permitted to be a /0 should you wish to match port between all destinations.

***

### ListSet

> **ListSet**: `"list:set"`

The list:set type uses a simple list in which you can store set names.
