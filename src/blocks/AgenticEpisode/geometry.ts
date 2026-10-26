/**
 * Where the Episode Timeline's points and labels go, horizontally. The CSS
 * draws the same layout from the panel's width alone (timelineCss); this is
 * the arithmetic, for the component's one refinement (edgeLabelWidth) and
 * for the tests.
 *
 * Labels sit under their points and never touch: a middle label is centred
 * on its point and at most the distance between two points less GAP wide. The
 * bar starts and ends half a label width in from the panel edges, and never
 * less than MIN_INSET, so with labels that wide every point sits in the middle
 * of an equal share of the panel.
 */

/** Space kept between two neighbouring labels. */
export const GAP = 12
/** The least the bar is inset from each panel edge. */
export const MIN_INSET = 60
/** Half the point's width: the first and last labels line up with its outer edge. */
export const DOT_RADIUS = 10

/** The bar's inset from each panel edge and the distance between points, for a panel `width` wide. */
export const timeline = (width: number, count: number): { inset: number; spacing: number } => {
  if (count < 2) return { inset: width / 2, spacing: 0 }
  // inset = (spacing - GAP) / 2 and spacing = (width - 2 * inset) / (count - 1), solved for inset.
  const inset = Math.max(MIN_INSET, (width - GAP * (count - 1)) / (2 * count))
  return { inset, spacing: (width - 2 * inset) / (count - 1) }
}

/** A middle label's widest. */
export const middleLabelWidth = (spacing: number): number => Math.max(0, spacing - GAP)

/**
 * The first (or last) label's widest. It runs from its point's outer edge
 * towards its neighbour and stops GAP short of the neighbour's label.
 *
 * With two points the neighbour is the other edge label, running towards it
 * from the far side, so each gets half. Otherwise the neighbour is a centred
 * middle label `neighbourWidth` wide (its rendered width, at most
 * middleLabelWidth), so the edge label gets whatever that leaves, but never
 * more than a middle label may have.
 */
export const edgeLabelWidth = (spacing: number, count: number, neighbourWidth?: number): number => {
  if (count < 2) return Math.max(0, spacing - GAP)
  if (count === 2) return Math.max(0, (spacing - GAP) / 2 + DOT_RADIUS)
  const neighbour = Math.min(neighbourWidth ?? middleLabelWidth(spacing), middleLabelWidth(spacing))
  return Math.max(0, Math.min(middleLabelWidth(spacing), spacing - neighbour / 2 - GAP + DOT_RADIUS))
}
