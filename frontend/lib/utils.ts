import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RuleCondition, RuleOp } from "./api";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** "land_ownership_document" -> "Land ownership document" */
export function humanize(slug: string): string {
  const spaced = slug.replace(/_/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function formatINR(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const OP_TEXT: Record<RuleOp, string> = {
  eq: "must be",
  neq: "must not be",
  lte: "must be at most",
  gte: "must be at least",
  lt: "must be below",
  gt: "must be above",
  in: "must be one of",
};

function formatRuleValue(value: string | number | boolean, field: string): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return field === "income" ? formatINR(value) : String(value);
  return humanize(value);
}

/** Human-readable text for a rule condition; prefers the backend-provided label. */
export function formatRuleLabel(rule: RuleCondition): string {
  if (rule.label) return rule.label;
  const field = humanize(rule.field);
  const op = OP_TEXT[rule.op] ?? rule.op;
  const value = Array.isArray(rule.value)
    ? rule.value.map((v) => formatRuleValue(v, rule.field)).join(", ")
    : formatRuleValue(rule.value, rule.field);
  return `${field} ${op} ${value}`;
}
