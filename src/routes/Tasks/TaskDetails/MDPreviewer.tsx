import React from "react";
import { useTranslation } from "react-i18next";
import { StyledDescriptionPreviewer } from "styles";
import ReactMarkdown from "react-markdown";
import { openExternalUrl, sanitizeMarkdownLinkUri } from "utils";

type Props = {
  description?: string;
  onClick?:
    | ((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void)
    | undefined;
};

const MDPreviewer: React.FC<Props> = ({ description, onClick }) => {
  const { t } = useTranslation();

  return (
    <StyledDescriptionPreviewer
      className="md-previewer"
      $hasValue={description != null}
      onClick={(event) => {
        const target = event.target as HTMLElement | null;
        const hasAnchorInPath = target?.closest("a");
        if (onClick && !hasAnchorInPath) {
          onClick(event);
        }
      }}
    >
      <ReactMarkdown
        urlTransform={sanitizeMarkdownLinkUri}
        components={{
          a: ({ href, ...props }) => (
            <a
              {...props}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => {
                // WebView ignora target=_blank; o opener nativo só aceita http(s).
                event.preventDefault();
                if (href) {
                  void openExternalUrl(href);
                }
              }}
            />
          ),
        }}
      >
        {description
          ? description
          : t("tasks.detailedDescriptionPlaceholder")}
      </ReactMarkdown>
    </StyledDescriptionPreviewer>
  );
};

export default React.memo(MDPreviewer);
