"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { applyCsvAction, previewCsvAction, saveProductAction } from "@/app/actions";

const INVALID_SAMPLE = `sku,name,brand,widthMm,heightMm,finish,color,marking,unitsPerBox,stockBoxes,active,discontinued,unitPriceTwd
FT-3030-MAT-A,重複,岩川,300,300,matte,米白,FT-A30,8,1,true,false,90
BAD,缺欄,岩川,0,300,shiny,藍,,8,-1,true,false,10
`;

export function CatalogManager() {
  const router = useRouter();
  const [issues, setIssues] = useState<{ row: number; message: string }[]>([]);
  const [csv, setCsv] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <form
        className="grid gap-2 rounded-xl bg-white p-4 sm:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const result = await saveProductAction({
            sku: String(form.get("sku") ?? ""),
            name: String(form.get("name") ?? ""),
            brand: String(form.get("brand") ?? ""),
            widthMm: Number(form.get("widthMm")),
            heightMm: Number(form.get("heightMm")),
            finish: String(form.get("finish")) as "matte",
            color: String(form.get("color") ?? ""),
            marking: String(form.get("marking") ?? ""),
            unitsPerBox: Number(form.get("unitsPerBox")),
            stockBoxes: Number(form.get("stockBoxes")),
            unitPriceTwd: Number(form.get("unitPriceTwd")),
            active: true,
            discontinued: false,
          });
          setMessage(result.ok ? "已儲存" : result.error);
          router.refresh();
        }}
      >
        <h2 className="sm:col-span-2 font-semibold">新增產品 / New product</h2>
        {["sku", "name", "brand", "widthMm", "heightMm", "color", "marking", "unitsPerBox", "stockBoxes", "unitPriceTwd"].map((name) => (
          <label key={name} className="text-sm">{name}
            <input name={name} required className="mt-1 w-full rounded border px-2 py-1" />
          </label>
        ))}
        <label className="text-sm">finish
          <select name="finish" className="mt-1 w-full rounded border px-2 py-1">
            <option value="matte">matte 霧面</option>
            <option value="glossy">glossy 亮面</option>
            <option value="textured">textured 止滑</option>
          </select>
        </label>
        <button className="rounded bg-stone-900 px-3 py-2 text-white" type="submit">建立 / Create</button>
        {message ? <p className="text-sm">{message}</p> : null}
      </form>

      <section className="rounded-xl bg-white p-4">
        <h2 className="font-semibold">匯入 CSV / Import</h2>
        <p className="text-sm text-stone-600">先預覽列錯誤，沒有錯誤才會寫入。不會覆蓋既有 SKU。</p>
        <a className="text-sm underline" href="/api/catalog/template">下載範本 / Template</a>
        <textarea value={csv} onChange={(event) => setCsv(event.target.value)} className="mt-2 w-full rounded border p-2 font-mono text-xs" rows={5} />
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="rounded border px-2 py-1" onClick={async () => setIssues((await previewCsvAction(csv)).issues)}>預覽 / Preview</button>
          <button type="button" className="rounded border px-2 py-1" onClick={() => setCsv(INVALID_SAMPLE)}>載入含錯誤的範例</button>
          <button
            type="button"
            className="rounded bg-stone-900 px-2 py-1 text-white"
            onClick={async () => {
              const result = await applyCsvAction(csv);
              setIssues(result.issues);
              setMessage(result.ok ? `已匯入 ${result.count} 筆` : result.error);
              router.refresh();
            }}
          >套用 / Apply</button>
        </div>
        {issues.length ? (
          <ul className="mt-2 text-sm text-rose-800">
            {issues.map((issue) => (
              <li key={`${issue.row}-${issue.message}`}>第 {issue.row} 列：{issue.message}</li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
