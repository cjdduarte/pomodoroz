const ABSOLUTE_URI_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

export const sanitizeMarkdownLinkUri = (uri: string): string => {
  const normalizedUri = uri.trim();

  if (!normalizedUri) return "#";
  if (normalizedUri.startsWith("#")) return normalizedUri;

  if (!ABSOLUTE_URI_REGEX.test(normalizedUri)) {
    return "#";
  }

  try {
    const parsedUri = new URL(normalizedUri);
    return SAFE_PROTOCOLS.has(parsedUri.protocol) ? normalizedUri : "#";
  } catch {
    return "#";
  }
};
