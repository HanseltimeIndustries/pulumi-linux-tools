import {
	RuleType,
	HeaderRule,
	HeaderRegexpRule,
	ClientIpRule,
	HostRegexpRule,
	HostRule,
	MethodRule,
	PathPrefixRule,
	PathRegexpRule,
	PathRule,
	QueryRegexpRule,
	QueryRule,
	BuiltRules,
	RuleCond,
	Condition,
} from "./types";

export enum TraefikRuleOp {
	Not,
}

/**
 * Simple container class with static methods to create Traefik routing rules
 */
export class TraefikRouteRule {
	static header(header: string, value: string, not?: TraefikRuleOp.Not) {
		return {
			type: RuleType.Header,
			rule: {
				header,
				value,
				not: not === TraefikRuleOp.Not,
			} as HeaderRule,
		};
	}
	static headerRegexp(header: string, value: RegExp, not?: TraefikRuleOp.Not) {
		return {
			type: RuleType.HeaderRegexp,
			rule: {
				header,
				value,
				not: not === TraefikRuleOp.Not,
			} as HeaderRegexpRule,
		};
	}
	static host(domain: string, not?: TraefikRuleOp.Not) {
		return {
			type: RuleType.Host,
			rule: {
				domain,
				not: not === TraefikRuleOp.Not,
			} as HostRule,
		};
	}
	static hostRegexp(domain: RegExp, not?: TraefikRuleOp.Not) {
		return {
			type: RuleType.HostRegexp,
			rule: {
				domain,
				not: not === TraefikRuleOp.Not,
			} as HostRegexpRule,
		};
	}
	static method(method: string, not?: TraefikRuleOp.Not) {
		return {
			type: RuleType.Method,
			rule: {
				method,
				not: not === TraefikRuleOp.Not,
			} as MethodRule,
		};
	}
	static path(path: string, not?: TraefikRuleOp.Not) {
		return {
			type: RuleType.Path,
			rule: {
				path,
				not: not === TraefikRuleOp.Not,
			} as PathRule,
		};
	}
	static pathPrefix(
		prefix: string,
		not?: TraefikRuleOp.Not,
	): {
		type: RuleType.PathPrefix;
		rule: PathPrefixRule;
	} {
		return {
			type: RuleType.PathPrefix,
			rule: {
				prefix,
				not: not === TraefikRuleOp.Not,
			} as PathPrefixRule,
		};
	}
	static pathRegexp(path: RegExp, not?: TraefikRuleOp.Not) {
		return {
			type: RuleType.PathRegexp,
			rule: {
				path,
				not: not === TraefikRuleOp.Not,
			} as PathRegexpRule,
		};
	}
	static query(key: string, value: string, not?: TraefikRuleOp.Not) {
		return {
			type: RuleType.Query,
			rule: {
				key,
				value,
				not: not === TraefikRuleOp.Not,
			} as QueryRule,
		};
	}
	static queryRegexp(key: string, value: RegExp, not?: TraefikRuleOp.Not) {
		return {
			type: RuleType.QueryRegexp,
			rule: {
				key,
				value,
				not: not === TraefikRuleOp.Not,
			} as QueryRegexpRule,
		};
	}
	static clientIP(ip: string, not?: TraefikRuleOp.Not) {
		return {
			type: RuleType.ClientIP,
			rule: {
				ip,
				not: not === TraefikRuleOp.Not,
			} as ClientIpRule,
		};
	}

	/**
	 * Conditionals
	 */
	static or(rules: (BuiltRules | Condition)[]) {
		return {
			type: RuleCond.And,
			rules,
		};
	}

	static and(rules: (BuiltRules | Condition)[]) {
		return {
			type: RuleCond.Or,
			rules,
		};
	}
}
