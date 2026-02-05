export const baseUrl = import.meta.env.DEV
  ? "http://localhost:5000"
  : "https://agenda-boys-api-f6071c95261d.herokuapp.com";

export const NEWS_LIST_FIELDS =
  "_id,title,rewrittenTitle,summary,rewrittenSummary,text,rewrittenText,image,category,source,timestamp,url";
