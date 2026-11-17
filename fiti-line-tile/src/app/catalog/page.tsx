import { prisma } from "@/lib/db";
import { CatalogManager } from "@/components/CatalogManager";
import { formatTwd } from "@/lib/format";

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim();
  const products = await prisma.product.findMany({
    where: query
      ? {
          OR: [
            { sku: { contains: query } },
            { name: { contains: query } },
            { brand: { contains: query } },
            { marking: { contains: query } },
            { color: { contains: query } },
          ],
        }
      : undefined,
    orderBy: { sku: "asc" },
  });
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">磁磚目錄</h1>
        <p className="en">Catalog · demo records, not a live shop account</p>
      </header>
      <form className="flex gap-2">
        <input name="q" defaultValue={query} placeholder="搜尋 SKU、品牌、印字" className="w-full rounded border bg-white px-3 py-2" />
        <button className="rounded bg-stone-900 px-3 text-white" type="submit">搜尋</button>
      </form>
      <div className="overflow-x-auto rounded-xl bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-stone-100">
            <tr>
              {["圖", "SKU", "品牌", "尺寸 mm", "表面", "顏色", "印字", "箱入", "庫存", "狀態", "單價"].map((label) => (
                <th key={label} className="p-2 font-medium">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-stone-100">
                <td className="p-2"><img src={product.imagePath} alt="" className="h-12 w-12 rounded object-cover" /></td>
                <td className="p-2">{product.sku}<div className="text-xs text-stone-500">{product.name}</div></td>
                <td className="p-2">{product.brand}</td>
                <td className="p-2">{product.widthMm}×{product.heightMm}</td>
                <td className="p-2">{product.finish}</td>
                <td className="p-2">{product.color}</td>
                <td className="p-2">{product.marking}</td>
                <td className="p-2">{product.unitsPerBox}</td>
                <td className="p-2">{product.stockBoxes}</td>
                <td className="p-2">{product.discontinued ? "停產" : product.active ? "在售" : "停用"}{product.stockBoxes === 0 ? " · 無庫存" : ""}</td>
                <td className="p-2">{formatTwd(product.unitPriceTwd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 ? <p className="p-4">沒有符合的產品。</p> : null}
      </div>
      <CatalogManager />
    </div>
  );
}
