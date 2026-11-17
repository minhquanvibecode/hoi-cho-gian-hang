import { SEED_SCENARIOS, type Order } from '../config/seed'
import { breakEven, projectPlan, projectScenario, soldSummary, totalPlannedQty, unitMarginVnd, visitorBuffer, type Projection } from '../lib/calc/plan'
import { formatNumber, formatVnd } from '../lib/format'
import { countChanged, type Assumptions } from '../state'
import { How, Progress, Slider } from './ui'
import { ScenarioChart, SuggestionsCard } from './Insights'

type Props = { a: Assumptions; setA: (fn: (a: Assumptions) => Assumptions) => void; orders: Order[]; goTo: (tab: string) => void }

const signClass = (n: number) => (n > 0 ? 'positive' : n < 0 ? 'negative' : '')

export function OverviewTab({ a, setA, orders, goTo }: Props) {
  const { products, fixedCosts, scenarios } = a
  const be = breakEven(products, fixedCosts)
  const plannedTotal = totalPlannedQty(products)
  const cols: { name: string; sub: string; p: Projection }[] = [
    ...scenarios.map((s) => ({
      name: s.name,
      sub: `${formatNumber(s.visitors)} lượt × ${s.buyRatePct}%`,
      p: projectScenario(s, products, fixedCosts),
    })),
    { name: 'Kế hoạch', sub: 'Theo bảng SP', p: projectPlan(products, fixedCosts) },
  ]
  const changed = countChanged(a)
  const sold = soldSummary(orders, products)

  return (
    <>
      <section className={`card wide assumption-banner ${changed ? 'is-changed' : ''}`}>
        <div className="row-between">
          <div>
            <b>{changed === 0 ? 'Giả định: dữ liệu BTC' : `Giả định: đã thay đổi ${changed} mục`}</b>
            <div className="note">
              {scenarios.map((s) => `${s.name} ${formatNumber(s.visitors)} lượt × ${s.buyRatePct}%`).join(' · ')}
            </div>
          </div>
          <button className="btn" onClick={() => goTo('gia-dinh')}>
            Sửa
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Thử nhanh lượng khách</h2>
        <p className="muted">Kéo thanh để xem lợi nhuận đổi ngay. Giá trị được lưu vào tab Giả định.</p>
        <div className="stack">
          {scenarios.map((s, i) => {
            const seed = SEED_SCENARIOS.find((x) => x.id === s.id)
            const p = cols[i].p
            const setField = (field: 'visitors' | 'buyRatePct', v: number) =>
              setA((prev) => ({ ...prev, scenarios: prev.scenarios.map((x) => (x.id === s.id ? { ...x, [field]: v } : x)) }))
            return (
              <fieldset key={s.id} className="group">
                <legend>{s.name}</legend>
                <Slider
                  label="Lượt khách"
                  value={s.visitors}
                  min={0}
                  max={Math.max(300, s.visitors)}
                  unit="lượt"
                  seedValue={seed?.visitors}
                  onChange={(v) => setField('visitors', v)}
                />
                <Slider label="Tỷ lệ mua" value={s.buyRatePct} min={0} max={100} unit="%" seedValue={seed?.buyRatePct} onChange={(v) => setField('buyRatePct', v)} />
                <p className="line" aria-live="polite">
                  {formatNumber(p.totalQty)} phần · lợi nhuận <b className={signClass(p.profitVnd)}>{formatVnd(p.profitVnd)}</b>
                  {p.safetyUnits !== null && (
                    <>
                      {' '}
                      · {p.safetyUnits >= 0 ? `vượt hòa vốn ${formatNumber(p.safetyUnits)} phần` : `thiếu ${formatNumber(-p.safetyUnits)} phần`}
                    </>
                  )}
                </p>
              </fieldset>
            )
          })}
        </div>
      </section>

      <section className="card">
        <h2>Điểm hòa vốn</h2>
        {be.units === null ? (
          <p className="negative">
            <b>Không thể hòa vốn:</b> lãi góp bình quân ≤ 0 đ/phần. Hãy tăng giá bán hoặc giảm chi phí biến đổi.
          </p>
        ) : (
          <>
            <div className="big-number">
              {formatNumber(be.units)} <span>phần</span>
            </div>
            <p className="muted">Cần bán tối thiểu chừng này phần (theo cơ cấu dự kiến) để không lỗ.</p>
          </>
        )}
        <div className="kpis top">
          <div className="kpi">
            <div className="label">Chi phí cố định</div>
            <div className="value">{formatVnd(be.fixedVnd)}</div>
          </div>
          <div className="kpi">
            <div className="label">Lãi góp bình quân</div>
            <div className="value">{formatVnd(be.avgMarginVnd)}</div>
            <div className="label">mỗi phần</div>
          </div>
        </div>
        {be.units !== null && orders.length > 0 && (
          <div className="stack-sm top">
            <div className="row-between">
              <span>Đơn thử đã bán</span>
              <b>
                {formatNumber(sold.totalQty)}/{formatNumber(be.units)} phần
              </b>
            </div>
            <Progress value={sold.totalQty} max={be.units} label="Đơn thử so với hòa vốn" />
          </div>
        )}
        <How>
          <p>
            <b>Lãi góp mỗi phần</b> = giá bán − chi phí biến đổi:
          </p>
          <ul>
            {products.map((p) => (
              <li key={p.id}>
                {p.name}: {formatVnd(p.priceVnd)} − {formatVnd(p.unitCostVnd)} = {formatVnd(unitMarginVnd(p))}
              </li>
            ))}
          </ul>
          <p>
            <b>Lãi góp bình quân</b> = Σ(lãi góp × số phần dự kiến) ÷ tổng số phần dự kiến (cơ cấu{' '}
            {products.map((p) => p.plannedQty).join(':')}):
          </p>
          <p>
            <code>
              ({products.map((p) => `${formatNumber(unitMarginVnd(p))}×${p.plannedQty}`).join(' + ')}) ÷ {formatNumber(plannedTotal)} ={' '}
              {formatNumber(be.avgMarginVnd)} đ/phần
            </code>
          </p>
          <p>
            <b>Chi phí cố định</b> = {fixedCosts.map((c) => formatNumber(c.amountVnd)).join(' + ')} = {formatVnd(be.fixedVnd)}
          </p>
          {be.rawUnits !== null && be.units !== null && (
            <p>
              <b>Số phần hòa vốn</b> = chi phí cố định ÷ lãi góp bình quân ={' '}
              <code>
                {formatNumber(be.fixedVnd)} ÷ {formatNumber(be.avgMarginVnd)} = {formatNumber(be.rawUnits)}
              </code>{' '}
              → <b>làm tròn lên {formatNumber(be.units)} phần</b> (bán {formatNumber(be.units - 1)} phần vẫn còn lỗ).
            </p>
          )}
        </How>
      </section>

      <section className="card wide">
        <h2>So sánh kịch bản</h2>
        <div className="table-wrap">
          <table className="compare">
            <thead>
              <tr>
                <th>Đơn vị: đồng</th>
                {cols.map((c) => (
                  <th key={c.name} className="num">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Số phần bán</td>
                {cols.map((c) => (
                  <td key={c.name} className="num">
                    {formatNumber(c.p.totalQty)}
                  </td>
                ))}
              </tr>
              <tr>
                <td>Doanh thu</td>
                {cols.map((c) => (
                  <td key={c.name} className="num">
                    {formatNumber(c.p.revenueVnd)}
                  </td>
                ))}
              </tr>
              <tr>
                <td>CP biến đổi</td>
                {cols.map((c) => (
                  <td key={c.name} className="num">
                    {formatNumber(c.p.variableVnd)}
                  </td>
                ))}
              </tr>
              <tr>
                <td>CP cố định</td>
                {cols.map((c) => (
                  <td key={c.name} className="num">
                    {formatNumber(c.p.fixedVnd)}
                  </td>
                ))}
              </tr>
              <tr className="total">
                <td>Lợi nhuận</td>
                {cols.map((c) => (
                  <td key={c.name} className={`num ${signClass(c.p.profitVnd)}`}>
                    {formatNumber(c.p.profitVnd)}
                  </td>
                ))}
              </tr>
              <tr>
                <td>Biên an toàn (phần)</td>
                {cols.map((c) => (
                  <td key={c.name} className={`num ${signClass(c.p.safetyUnits ?? -1)}`}>
                    {c.p.safetyUnits === null ? '—' : formatNumber(c.p.safetyUnits)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="note">Cột "Kế hoạch" bán đúng số phần dự kiến trong bảng sản phẩm, để tham khảo.</p>
      </section>

      <ScenarioChart products={products} costs={fixedCosts} scenarios={scenarios} />

      {cols.slice(0, scenarios.length).map((c, i) => (
        <ScenarioCard key={c.name} name={c.name} note={scenarios[i].note} sub={c.sub} p={c.p} visitors={scenarios[i].visitors} rate={scenarios[i].buyRatePct} />
      ))}

      <SuggestionsCard products={products} costs={fixedCosts} scenarios={scenarios} />
    </>
  )
}

function ScenarioCard({ name, note, p, visitors, rate }: { name: string; note: string; sub: string; p: Projection; visitors: number; rate: number }) {
  return (
    <section className="card">
      <h2>
        Kịch bản {name} <span className="note">· {note}</span>
      </h2>
      <div className="kpis">
        <div className="kpi">
          <div className="label">Doanh thu dự kiến</div>
          <div className="value">{formatVnd(p.revenueVnd)}</div>
        </div>
        <div className="kpi">
          <div className="label">Lợi nhuận dự kiến</div>
          <div className={`value ${signClass(p.profitVnd)}`}>{formatVnd(p.profitVnd)}</div>
        </div>
        <div className="kpi">
          <div className="label">Tổng CP biến đổi</div>
          <div className="value">{formatVnd(p.variableVnd)}</div>
        </div>
        <div className="kpi">
          <div className="label">Biên an toàn</div>
          <div className={`value ${signClass(p.safetyUnits ?? -1)}`}>
            {p.safetyUnits === null ? '—' : `${formatNumber(p.safetyUnits)} phần`}
          </div>
        </div>
      </div>
      <p className="line top">
        {p.safetyUnits === null
          ? 'Không thể hòa vốn với giá và chi phí hiện tại.'
          : p.safetyUnits >= 0
            ? `Bán ${formatNumber(p.totalQty)} phần, vượt điểm hòa vốn ${formatNumber(p.safetyUnits)} phần (≈ ${formatNumber(visitorBuffer(p.safetyUnits, rate) ?? 0)} lượt khách có thể hụt mà vẫn không lỗ).`
            : `Bán ${formatNumber(p.totalQty)} phần, còn thiếu ${formatNumber(-p.safetyUnits)} phần để hòa vốn.`}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th className="num">Phần</th>
              <th className="num">Doanh thu (đ)</th>
            </tr>
          </thead>
          <tbody>
            {p.lines.map((l) => (
              <tr key={l.product.id}>
                <td>{l.product.name}</td>
                <td className="num">{formatNumber(l.qty)}</td>
                <td className="num">{formatNumber(l.revenueVnd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <How>
        <p>
          <b>Số khách mua</b> = lượt khách × tỷ lệ mua = {formatNumber(visitors)} × {rate}% = {formatNumber(p.rawBuyers)}
          {p.rawBuyers !== p.buyers && <> → làm tròn gần nhất (0,5 lên) = {formatNumber(p.buyers)}</>} khách. Giả định mỗi khách mua 1
          phần → <b>{formatNumber(p.buyers)} phần</b>.
        </p>
        <p>
          <b>Chia theo cơ cấu</b> số phần dự kiến ({p.lines.map((l) => l.product.plannedQty).join(':')}):{' '}
          {p.lines.map((l) => `${l.product.name} ${formatNumber(l.rawQty)}`).join(' · ')}. Làm tròn tới phần nguyên theo{' '}
          <b>phần dư lớn nhất</b> (lấy phần nguyên, rồi cộng 1 cho món có phần lẻ lớn nhất) để tổng đúng bằng {formatNumber(p.buyers)}:{' '}
          {p.lines.map((l) => `${l.product.name} ${l.qty}`).join(' · ')}.
        </p>
        <p>
          <b>Doanh thu</b> = Σ(giá × phần) = {p.lines.map((l) => `${formatNumber(l.product.priceVnd)}×${l.qty}`).join(' + ')} ={' '}
          {formatVnd(p.revenueVnd)}
        </p>
        <p>
          <b>CP biến đổi</b> = Σ(chi phí/phần × phần) = {p.lines.map((l) => `${formatNumber(l.product.unitCostVnd)}×${l.qty}`).join(' + ')} ={' '}
          {formatVnd(p.variableVnd)}
        </p>
        <p>
          <b>Lợi nhuận</b> = doanh thu − CP biến đổi − CP cố định = {formatNumber(p.revenueVnd)} − {formatNumber(p.variableVnd)} −{' '}
          {formatNumber(p.fixedVnd)} = {formatVnd(p.profitVnd)}
        </p>
        {p.breakEvenUnits !== null && (
          <p>
            <b>Biên an toàn</b> = số phần bán − số phần hòa vốn = {formatNumber(p.totalQty)} − {formatNumber(p.breakEvenUnits)} ={' '}
            {formatNumber(p.safetyUnits ?? 0)} phần. Quy ra lượt khách: biên an toàn ÷ tỷ lệ mua (làm tròn xuống).
          </p>
        )}
      </How>
    </section>
  )
}
