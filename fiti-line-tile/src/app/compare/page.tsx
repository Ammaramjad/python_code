const rows = [
  {
    name: "本示範",
    channel: "LINE 模擬器；真實 LINE 預設關閉",
    documented: "未知已安裝磁磚的照片與尺寸會進入同一套排序。人員可看到相符與衝突，並在報價維持相同品或替代品的區別。",
    verify: "本機示範可重現三個劇本。",
    sources: [],
  },
  {
    name: "Jidou AI",
    channel: "廠商描述：LINE 與其他渠道",
    documented: "廠商描述包含照片與文件、訂單審核、價格回覆、ERP 串接。",
    verify: "Verify in vendor demo：能否辨識未知的已安裝磁磚，並把比對證據帶到報價。",
    sources: ["https://jidou.ai/ai-order-agent", "https://jidou.ai/"],
  },
  {
    name: "OrderUp B2B",
    channel: "廠商描述：LINE 接單",
    documented: "廠商描述包含手寫訂單、客別價格、訂貨入口、出貨追蹤、ERP 與報表。",
    verify: "Verify in vendor demo：下單前能否處理尚未辨識的產品。",
    sources: ["https://experthub.asus.com/solution/detail/253"],
  },
  {
    name: "Effect Tech",
    channel: "廠商描述：LINE 與 email",
    documented: "廠商描述包含產品代碼比對、缺欄追問、信心標記、人員核准、ERP/CRM。",
    verify: "Verify in vendor demo：磁磚照片與印字比對，以及相同品／替代品分類。",
    sources: ["https://effectstudio.com.tw/ai-solutions/line-ai-agent"],
  },
  {
    name: "Parspec",
    channel: "廠商描述：建材經銷 RFQ",
    documented: "廠商描述包含文件擷取、選品、投標追蹤、報價分享與分析。",
    verify: "Verify in vendor demo：繁中 LINE 對話裡的已安裝磁磚照片流程。",
    sources: ["https://www.parspec.io/quoting"],
  },
  {
    name: "RoomDreaming",
    channel: "廠商描述：空間照片視覺化",
    documented: "廠商描述包含磁磚與材料視覺化，以及經銷詢問。",
    verify: "Verify in vendor demo：已安裝磁磚的替代辨識是否接到人員核准報價。",
    sources: ["https://www.roomdreaming.com/"],
  },
];

export default function ComparePage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">同業對照</h1>
        <p className="en">Competitor comparison · vendor-described capabilities only</p>
      </header>
      <p className="rounded-xl bg-white p-4 text-sm">
        我們協助建材行人員用外觀與實體證據辨識未知的已安裝磁磚，並在報價時保留「已驗證相同品」和「替代品」的區別。
      </p>
      <div className="space-y-3">
        {rows.map((row) => (
          <article key={row.name} className="rounded-xl bg-white p-4 text-sm">
            <h2 className="font-semibold">{row.name}</h2>
            <p className="mt-1"><span className="text-stone-500">渠道：</span>{row.channel}</p>
            <p className="mt-1"><span className="text-stone-500">公開敘述：</span>{row.documented}</p>
            <p className="mt-1"><span className="text-stone-500">需在對方示範確認：</span>{row.verify}</p>
            <ul className="mt-1">
              {row.sources.map((source) => (
                <li key={source}><a className="break-all underline" href={source}>{source}</a></li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <section className="rounded-xl bg-white p-4 text-sm">
        <h2 className="font-semibold">同一組 10 件匿名詢問的比較計畫</h2>
        <p className="mt-2">尚未執行。下表沒有廠商示範結果，也沒有客戶承諾。</p>
        <table className="mt-3 w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-1">紀錄</th>
              <th>候選品質</th>
              <th>追問品質</th>
              <th>人員主動處理分鐘</th>
              <th>建置投入</th>
            </tr>
          </thead>
          <tbody>
            {["本原型", "Jidou AI", "OrderUp B2B", "Effect Tech", "Parspec", "RoomDreaming"].map((name) => (
              <tr key={name} className="border-b">
                <td className="py-1">{name}</td>
                <td>尚未實測</td>
                <td>尚未實測</td>
                <td>尚未實測</td>
                <td>尚未實測</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
