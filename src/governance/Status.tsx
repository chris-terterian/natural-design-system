import registry from '../../governance/components.json';
import exceptionsFile from '../../governance/a11y-exceptions.json';
import { Badge, type BadgeTone } from '../components/Badge/Badge';

/** Status tones reuse the system's own Badge: the words carry the meaning, tone reinforces it. */
const TONE: Record<string, BadgeTone> = { proposed: 'outline', 'in-progress': 'outline', beta: 'light', stable: 'success', deprecated: 'sale' };
const LABEL: Record<string, string> = { proposed: 'Proposed', 'in-progress': 'In progress', beta: 'Beta', stable: 'Stable', deprecated: 'Deprecated' };

const cell = { padding: '10px 12px', borderBottom: '1px solid var(--nds-color-taupe-200)', verticalAlign: 'top', textAlign: 'left' } as const;
const FIGMA = 'https://www.figma.com/design/84MjZXozBoKCvf9lwIU5pu/Natural-Design-System?node-id=';

export const StatusLegend = () => (
  <table style={{ borderCollapse: 'collapse', width: '100%' }}>
    <tbody>
      {Object.entries(registry.statuses).map(([key, meaning]) => (
        <tr key={key}>
          <td style={{ ...cell, whiteSpace: 'nowrap' }}><Badge tone={TONE[key]}>{LABEL[key]}</Badge></td>
          <td style={cell}>{meaning}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export const StatusTable = ({ figmaNodes }: { figmaNodes: Record<string, string> }) => (
  <table style={{ borderCollapse: 'collapse', width: '100%' }}>
    <thead>
      <tr>{['Component', 'Status', 'Exports', 'Figma', 'Notes'].map((h) => <th key={h} style={cell}>{h}</th>)}</tr>
    </thead>
    <tbody>
      {registry.components.map((c) => (
        <tr key={c.name}>
          <td style={cell}><strong>{c.name}</strong><br /><small>since {c.since}</small></td>
          <td style={cell}><Badge tone={TONE[c.status]}>{LABEL[c.status]}</Badge></td>
          <td style={cell}><code>{c.exports.join(', ')}</code></td>
          <td style={cell}><a href={FIGMA + figmaNodes[c.figmaKey].replace(':', '-')} target="_blank" rel="noreferrer">{figmaNodes[c.figmaKey]}</a></td>
          <td style={cell}>{c.notes || 'None'}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export const ExceptionsTable = () => (
  <table style={{ borderCollapse: 'collapse', width: '100%' }}>
    <thead>
      <tr>{['ID', 'Rule', 'Applies to', 'Why it’s allowed', 'Review'].map((h) => <th key={h} style={cell}>{h}</th>)}</tr>
    </thead>
    <tbody>
      {exceptionsFile.exceptions.map((e) => (
        <tr key={e.id}>
          <td style={cell}>{e.id}</td>
          <td style={cell}><code>{e.rule}</code></td>
          <td style={cell}><code>{e.selector}</code></td>
          <td style={cell}>{e.reason}<br /><small>WCAG {e.wcag}</small></td>
          <td style={cell}>{e.review}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const GATES = [
  ['Typecheck', 'Yes', 'TypeScript compiles'],
  ['Governance check', 'Yes', 'Registry ↔ stories ↔ Figma links ↔ DESIGN.md specs; tokens resolve and generated files are current'],
  ['Storybook build', 'Yes', 'Every story builds'],
  ['Accessibility gate', 'Yes', 'axe (WCAG 2.0 / 2.1 / 2.2, A + AA) on every story, minus registered exceptions'],
  ['Figma ↔ code parity', 'Yes', 'Every variable per mode, both directions; linked Figma nodes exist with registry names; no unwired properties; text styles bound. Compared against a committed snapshot exported from the live file via the Figma MCP (refreshed with every Figma change)'],
];

export const GatesTable = () => (
  <table style={{ borderCollapse: 'collapse', width: '100%' }}>
    <thead>
      <tr>{['Gate', 'Blocks deploy', 'What it checks'].map((h) => <th key={h} style={cell}>{h}</th>)}</tr>
    </thead>
    <tbody>
      {GATES.map(([g, b, w]) => (
        <tr key={g}><td style={cell}><strong>{g}</strong></td><td style={cell}>{b}</td><td style={cell}>{w}</td></tr>
      ))}
    </tbody>
  </table>
);
