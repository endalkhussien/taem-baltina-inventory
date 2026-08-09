export function purchaseUnitCost(quantity: number, costTotal: number) {
  if (!quantity || quantity <= 0) return 0
  return Number((costTotal / quantity).toFixed(4))
}

/** Weighted average: (oldQty × oldAvg + newCost) ÷ (oldQty + newQty) */
export function weightedAverageCost(
  currentQuantity: number,
  currentAverageCost: number,
  purchaseQuantity: number,
  purchaseCostTotal: number
) {
  const oldQty = Number(currentQuantity)
  const oldAvg = Number(currentAverageCost)
  const addQty = Number(purchaseQuantity)
  const addCost = Number(purchaseCostTotal)

  if (addQty <= 0) return oldAvg

  const newQty = oldQty + addQty
  if (newQty <= 0) return purchaseUnitCost(addQty, addCost)

  const oldValue = oldQty * oldAvg
  return Number(((oldValue + addCost) / newQty).toFixed(4))
}

export function formatCostFormula(
  currentQuantity: number,
  currentAverageCost: number,
  purchaseQuantity: number,
  purchaseCostTotal: number,
  unitLabel = 'unit'
) {
  const oldQty = Number(currentQuantity)
  const oldAvg = Number(currentAverageCost)
  const addQty = Number(purchaseQuantity)
  const addCost = Number(purchaseCostTotal)
  const newAvg = weightedAverageCost(oldQty, oldAvg, addQty, addCost)

  if (addQty <= 0) return 'Enter quantity and cost to see average cost.'

  const unitThisPurchase = purchaseUnitCost(addQty, addCost)
  return `This purchase: ${addQty} × ${unitThisPurchase.toFixed(2)} = ${addCost.toFixed(2)} ETB. New average: (${oldQty.toFixed(3)}×${oldAvg.toFixed(2)} + ${addCost.toFixed(2)}) ÷ ${(oldQty + addQty).toFixed(3)} = ${newAvg.toFixed(2)} ETB/${unitLabel}`
}
