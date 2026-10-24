import React from 'react'

import { BlockIcon } from '@/components/BlockIcon'

import { Anchor } from './Anchor'
import { panelLayout, type MenuEntry, type MenuGroup, type NavItem } from './megaMenuLayout'

export type FeaturedImage = { src: string; alt: string }

export const Badge: React.FC<{ badge: MenuEntry['badge'] }> = ({ badge }) =>
  badge ? <span className={`ncx-pill ncx-pill--${badge}`}>{badge === 'new' ? 'New' : 'Beta'}</span> : null

/**
 * One row: icon, label (with its badge) and description. The whole row is the
 * link. The icon sits in a fixed slot as tall as the label's line, so a row
 * without a description lines up with one that has it.
 */
const Item: React.FC<{ item: MenuEntry; withIcon: boolean }> = ({ item, withIcon }) => (
  <li>
    <Anchor className="ncx-mega__item" href={item.href} newTab={item.newTab}>
      {withIcon ? (
        <span className="ncx-mega__icon">{item.icon ? <BlockIcon name={item.icon} fallback="sparkles" round /> : null}</span>
      ) : null}
      <span className="ncx-mega__text">
        <span className="ncx-mega__label">
          {item.label}
          <Badge badge={item.badge} />
        </span>
        {item.description ? <span className="ncx-mega__desc">{item.description}</span> : null}
      </span>
    </Anchor>
  </li>
)

/**
 * The panel of one mega menu: its groups side by side, then the featured card.
 * The layout rules are in megaMenuLayout.ts (panelLayout); where the panel sits is
 * worked out by the header (place() in Component.client.tsx), which measures it.
 */
export const MegaPanel = React.forwardRef<
  HTMLDivElement,
  { id: string; groups: MenuGroup[]; featured: NavItem['featured']; image?: FeaturedImage | null }
>(function MegaPanel({ id, groups, featured, image }, ref) {
  const layout = panelLayout(groups, featured)
  const card = layout.featured

  return (
    <div className="ncx-mega" id={id} ref={ref}>
      {layout.groups.map((g) => {
        const labelId = `${id}-${g.id}`
        const showLabel = layout.showLabels && Boolean(g.label)
        return (
          <div className="ncx-mega__group" key={g.id}>
            {showLabel ? (
              <p className="ncx-mega__eyebrow" id={labelId}>
                {g.label}
              </p>
            ) : layout.reserveLabel ? (
              <p className="ncx-mega__eyebrow" aria-hidden="true">
                {' '}
              </p>
            ) : null}
            <ul
              className={`ncx-mega__list${g.grid ? ' is-grid' : ''}`}
              {...(showLabel ? { 'aria-labelledby': labelId } : {})}
            >
              {g.items.map((item) => (
                <Item key={item.id} item={item} withIcon={layout.hasIcons} />
              ))}
            </ul>
          </div>
        )
      })}

      {card ? <FeaturedCard card={card} image={image} /> : null}
    </div>
  )
})

/** The last column: a tinted card, a link when it has somewhere to go. */
const FeaturedCard: React.FC<{
  card: NonNullable<ReturnType<typeof panelLayout>['featured']>
  image?: FeaturedImage | null
}> = ({ card, image }) => {
  const body = (
    <>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.src} alt={image.alt} width={240} height={150} decoding="async" />
      ) : null}
      {card.eyebrow ? <span className="ncx-mega__feature-eyebrow">{card.eyebrow}</span> : null}
      <span className="ncx-mega__feature-title">{card.title}</span>
      {card.href ? (
        <span className="ncx-mega__feature-cta">
          {card.linkLabel || 'Learn more'}
          <span aria-hidden="true"> &rarr;</span>
        </span>
      ) : null}
    </>
  )
  return card.href ? (
    <Anchor className="ncx-mega__feature" href={card.href} newTab={card.newTab}>
      {body}
    </Anchor>
  ) : (
    <div className="ncx-mega__feature">{body}</div>
  )
}
