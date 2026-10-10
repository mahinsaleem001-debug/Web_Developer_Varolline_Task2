import { api } from '../api.js';
import { el } from '../ui.js';

function statCard(label, value, tone) {
  return el('div', { class: `stat stat-${tone}` }, el('strong', {}, value), el('span', {}, label));
}

function weekdayLabel(isoDate) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' });
}

export async function reportsPage() {
  const report = await api.reportSummary();
  const peak = Math.max(1, ...report.signupsLast7Days.map((day) => day.count));
  const signupsThisWeek = report.signupsLast7Days.reduce((sum, day) => sum + day.count, 0);

  return el(
    'div',
    { class: 'page' },
    el('h1', { class: 'page-title' }, 'Reports'),
    el('p', { class: 'muted page-sub' }, 'Visible to managers and admins only.'),
    el(
      'div',
      { class: 'stats' },
      statCard('Total users', report.totalUsers, 'primary'),
      statCard('Members', report.byRole.user, 'neutral'),
      statCard('Managers', report.byRole.manager, 'info'),
      statCard('Admins', report.byRole.admin, 'accent')
    ),
    el(
      'section',
      { class: 'card' },
      el('h2', {}, 'New accounts in the last 7 days'),
      el('p', { class: 'muted' }, `${signupsThisWeek} new account${signupsThisWeek === 1 ? '' : 's'} this week.`),
      el(
        'div',
        { class: 'bars', role: 'img', 'aria-label': 'Bar chart of new accounts per day' },
        report.signupsLast7Days.map((day) =>
          el(
            'div',
            { class: 'bar-col' },
            el('span', { class: 'bar-value' }, day.count),
            el('div', { class: 'bar', style: `height: ${Math.max(4, (day.count / peak) * 100)}%` }),
            el('span', { class: 'bar-label' }, weekdayLabel(day.date))
          )
        )
      )
    )
  );
}
