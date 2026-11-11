import { MediaBlock } from '@/blocks/MediaBlock/Component'
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedLinkNode,
  type DefaultTypedEditorState,
} from '@payloadcms/richtext-lexical'
import {
  JSXConvertersFunction,
  LinkJSXConverter,
  RichText as ConvertRichText,
} from '@payloadcms/richtext-lexical/react'

import { CodeBlock, CodeBlockProps } from '@/blocks/Code/Component'

import type {
  BannerBlock as BannerBlockProps,
  CallToActionBlock as CTABlockProps,
  MediaBlock as MediaBlockProps,
} from '@/payload-types'
import { BannerBlock } from '@/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { cn } from '@/utilities/ui'

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<CTABlockProps | MediaBlockProps | BannerBlockProps | CodeBlockProps>

// The linked entry arrives populated only when it exists and visitors may
// read it. A deleted, unpublished or hidden target comes back as a bare id,
// or not at all.
const linkedSlug = (linkNode: SerializedLinkNode): string | null => {
  const value = linkNode.fields.doc?.value
  return value && typeof value === 'object' && typeof value.slug === 'string' && value.slug ? value.slug : null
}

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const slug = linkedSlug(linkNode)
  return linkNode.fields.doc?.relationTo === 'posts' ? `/posts/${slug}` : `/${slug}`
}

const links = LinkJSXConverter({ internalDocToHref })

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...links,
  // A link to an entry visitors cannot reach keeps its words and loses the
  // link, rather than failing the whole page.
  link: (args) => {
    const { node, nodesToJSX } = args
    if (node.fields.linkType === 'internal' && !linkedSlug(node)) return <>{nodesToJSX({ nodes: node.children })}</>
    return typeof links.link === 'function' ? links.link(args) : links.link
  },
  // As the default, plus the anchor id the legal document layout gives its sections (blocks/Content/legalOutline.ts).
  heading: ({ node, nodesToJSX }) => {
    const Tag = node.tag
    return <Tag id={(node as { anchorId?: string }).anchorId}>{nodesToJSX({ nodes: node.children })}</Tag>
  },
  blocks: {
    banner: ({ node }) => <BannerBlock className="col-start-2 mb-4" {...node.fields} />,
    mediaBlock: ({ node }) => (
      <MediaBlock
        className="col-start-1 col-span-3"
        imgClassName="m-0"
        {...node.fields}
        captionClassName="mx-auto max-w-[48rem]"
        enableGutter={false}
        disableInnerContainer={true}
      />
    ),
    code: ({ node }) => <CodeBlock className="col-start-2" {...node.fields} />,
    cta: ({ node }) => <CallToActionBlock {...node.fields} />,
  },
})

type Props = {
  data: DefaultTypedEditorState
  enableGutter?: boolean
  enableProse?: boolean
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const { className, enableProse = true, enableGutter = true, ...rest } = props
  return (
    <ConvertRichText
      converters={jsxConverters}
      className={cn(
        'payload-richtext',
        {
          container: enableGutter,
          'max-w-none': !enableGutter,
          'mx-auto prose md:prose-md': enableProse,
        },
        className,
      )}
      {...rest}
    />
  )
}
