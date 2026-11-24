import React, { useMemo, useRef, useState } from 'react'

// Parsers return null for invalid input.
export function parseQuantity(text) {
  if (!/^\d+$/.test(text)) return null
  const n = Number(text)
  return n >= 1 && n <= 1000 ? n : null
}
export function parsePrice(text) {
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null
  return Number(text)
}
export function parseDiscount(text) {
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null
  const n = Number(text)
  return n <= 100 ? n : null
}

// Works in whole cents to avoid floating-point surprises.
export function calculateTotal(quantity, price, discountPercent) {
  const subtotalCents = quantity * Math.round(price * 100)
  const totalCents = Math.round((subtotalCents * (100 - discountPercent)) / 100)
  return totalCents / 100
}

const DEFAULTS = { quantity: '2', price: '50', discount: '10' }

export default function App() {
  // CONTRIBUTION FOCUS: operation counts. Instead of a speed threshold, the page
  // reports how many times it rendered and how many times the total was calculated.
  const renders = useRef(0)
  const calcs = useRef(0)
  renders.current += 1

  const [quantity, setQuantity] = useState(DEFAULTS.quantity)
  const [price, setPrice] = useState(DEFAULTS.price)
  const [discount, setDiscount] = useState(DEFAULTS.discount)

  const q = parseQuantity(quantity)
  const p = parsePrice(price)
  const d = parseDiscount(discount)

  const total = useMemo(() => {
    calcs.current += 1
    if (q === null || p === null || d === null) return null
    return calculateTotal(q, p, d)
  }, [q, p, d])

  const reset = () => {
    setQuantity(DEFAULTS.quantity)
    setPrice(DEFAULTS.price)
    setDiscount(DEFAULTS.discount)
  }

  return (
    <div>
      <h1>Price calculator</h1>
      <label>Quantity <input aria-label="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></label>
      <button onClick={() => setQuantity(String((q ?? 0) + 1))}>+1 quantity</button>
      {q === null && <span role="alert" data-testid="quantity-error">Quantity: must be a whole number from 1 to 1000</span>}
      <br />
      <label>Price <input aria-label="Price" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
      {p === null && <span role="alert" data-testid="price-error">Price: must be a number of 0 or more</span>}
      <br />
      <label>Discount (%) <input aria-label="Discount" value={discount} onChange={(e) => setDiscount(e.target.value)} /></label>
      {d === null && <span role="alert" data-testid="discount-error">Discount: must be a number from 0 to 100</span>}
      <br />
      <button onClick={reset}>Reset</button>
      <p data-testid="total">Total: {total === null ? 'n/a' : total}</p>
      <p data-testid="counters" data-renders={renders.current} data-calcs={calcs.current}>
        Renders: {renders.current}, calculations: {calcs.current}
      </p>
    </div>
  )
}
