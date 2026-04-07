declare global {
  interface String {
    capitalize(): string;
    truncate(n: number): string;
    isEmpty(): boolean;
  }
}

String.prototype.capitalize = function (): string {
  if (typeof this !== "string") return "";
  return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.truncate = function (n): string {
  if (typeof this !== "string") return "";
  return this.length > n ? this.substr(0, n - 1) + "..." : this;
};

String.prototype.isEmpty = function (): boolean {
  return (
    this === undefined ||
    this === null ||
    (typeof this === "string" && this.trim().length === 0)
  );
};

export {};
