import { catalogTemplateCsv } from "@/lib/csv";

export function GET() {
  return new Response(catalogTemplateCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=tile-template.csv",
    },
  });
}
