import type { ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageTemplate, type Composition } from './PageTemplate';
import { expandProductRefs } from '../../templates/contract.mjs';
import examples from './examples.json';
import { figma, FIGMA_NODES } from '../../figma';

const expand = (c: unknown) => expandProductRefs(c, examples.products as Record<string, unknown[]>) as Composition;
const HOMEPAGE = expand(examples.valid.homepage);
const COLLECTION = expand(examples.valid.collection);
const PRODUCT = expand(examples.valid.product);

const meta = {
  title: 'Components/Page Template',
  tags: ['status:beta'],
  component: PageTemplate,
  parameters: { ...figma(FIGMA_NODES.pageTemplate), layout: 'fullscreen' },
  args: { composition: HOMEPAGE },
} satisfies Meta<typeof PageTemplate>;
export default meta;
type Story = StoryObj<typeof meta>;

const desktop = (Story: ComponentType) => <div data-nds-mode="desktop" style={{ width: 1440 }}><Story /></div>;
const mobile = (Story: ComponentType) => <div data-nds-mode="mobile" style={{ width: 375 }}><Story /></div>;

/** Hero, then rows of products and studio stories. Products always come first, and stories never stack. */
export const Homepage: Story = { decorators: [desktop] };
export const HomepageMobile: Story = { name: 'Homepage (mobile)', decorators: [mobile] };
/** Banner, intro, filters, rows of products with a story between them, then Show more. */
export const Collection: Story = { args: { composition: COLLECTION }, decorators: [desktop] };
export const CollectionMobile: Story = { name: 'Collection (mobile)', args: { composition: COLLECTION }, decorators: [mobile] };
/** Gallery beside the summary, then details, then related pieces. */
export const ProductPage: Story = { name: 'Product page', args: { composition: PRODUCT }, decorators: [desktop] };
export const ProductPageMobile: Story = { name: 'Product page (mobile)', args: { composition: PRODUCT }, decorators: [mobile] };

/**
 * A returning shopper. Both rows are personalised and each names its reason in the composition.
 * "Recently viewed" has only one product, so the contract swaps in its fallback (Cups & mugs).
 * The reason label itself ships in a later release.
 */
export const Personalised: Story = { args: { composition: expand(examples.personalised.returning) }, decorators: [desktop] };

/** Two heroes and only stories: the contract rejects the page and lists why, instead of rendering it. */
export const RejectedHomepage: Story = {
  name: 'Rejected: two heroes, no products',
  args: { composition: expand(examples.rejected['two-heroes-no-products'].composition) },
  decorators: [(Story) => <div style={{ width: 720, padding: 24 }}><Story /></div>],
};
/** A personalised row with no reason and no fallback for shoppers without history. */
export const RejectedPersonalised: Story = {
  name: 'Rejected: personalised row without a fallback',
  args: { composition: expand(examples.rejected['personalised-without-fallback'].composition) },
  decorators: [(Story) => <div style={{ width: 720, padding: 24 }}><Story /></div>],
};

const TEMPLATES: [string, Composition][] = [['Homepage', HOMEPAGE], ['Collection', COLLECTION], ['Product page', PRODUCT]];

/** Mirrors the Figma grid: Template = Homepage, Collection, Product page columns · Breakpoint = Desktop, Mobile rows. */
export const AllVariants: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <table style={{ borderSpacing: 48, fontSize: 12, textAlign: 'left', verticalAlign: 'top' }}>
      <thead>
        <tr><th />{TEMPLATES.map(([name]) => <th key={name}>Template / {name}</th>)}</tr>
      </thead>
      <tbody>
        {([['Desktop', 1440, 'desktop'], ['Mobile', 375, 'mobile']] as const).map(([bp, width, mode]) => (
          <tr key={bp} style={{ verticalAlign: 'top' }}>
            <th>Breakpoint / {bp}</th>
            {TEMPLATES.map(([name, c]) => (
              <td key={name}><div data-nds-mode={mode} style={{ width }}><PageTemplate composition={c} /></div></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
