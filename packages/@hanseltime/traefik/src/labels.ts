import type { BuiltRules, Condition } from "./types";
import { RuleCond, RuleType } from "./types";

/**
 * Creates an http routing rule for label based providers like docker compose
 * @param routerName - the router name
 * @param rule - a top level rule or condition (like an and/or)
 * @returns
 */
export function createHttpRouteRuleLabel(
	routerName: string,
	rule: BuiltRules | Condition,
) {
	return `traefik.http.routers.${routerName}.rule=${createRuleLabelExpression(rule)}`;
}

function createRuleLabelExpression(rule: BuiltRules | Condition): string {
	if (rule.type === RuleCond.And) {
		return `(${rule.rules
			.map((r) => {
				createRuleLabelExpression(r);
			})
			.join(" && ")})`;
	} else if (rule.type === RuleCond.Or) {
		return `(${rule.rules
			.map((r) => {
				createRuleLabelExpression(r);
			})
			.join(" || ")})`;
	} else {
		return createRuleLabelValue(rule as BuiltRules);
	}
}

function createRuleLabelValue(r: BuiltRules) {
	const not = r.rule.not ? "!" : "";
	switch (r.type) {
		case RuleType.ClientIP:
			return `${not}ClientIP(\`${r.rule.ip}\`)`;
		case RuleType.Header:
			return `${not}Header(\`${r.rule.header}\`, \`${r.rule.value}\`)`;
		case RuleType.HeaderRegexp:
			return `${not}HeaderRegexp(\`${r.rule.header}\`, \`${r.rule.value.source}\`)`;
		case RuleType.Host:
			return `${not}Host(\`${r.rule.domain}\`)`;
		case RuleType.HostRegexp:
			return `${not}HostRegexp(\`${r.rule.domain.source}\`)`;
		case RuleType.Method:
			return `Method(\`${r.rule.method}\`)`;
		case RuleType.Path:
			return `${not}Path(\`${r.rule.path}\`)`;
		case RuleType.PathPrefix:
			return `${not}PathPrefix(\`${r.rule.prefix}\`)`;
		case RuleType.PathRegexp:
			return `${not}PathRegexp(\`${r.rule.path.source}\`)`;
		case RuleType.Query:
			return `${not}Query(\`${r.rule.key}\`, \`${r.rule.value}\`)`;
		case RuleType.QueryRegexp:
			return `${not}QueryRegexp(\`${r.rule.key}\`, \`${r.rule.value.source}\`)`;
	}
	throw new Error(`Unknown Traefik rule type ${(r as any).type}`);
}
