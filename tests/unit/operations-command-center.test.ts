import { describe, expect, it } from 'vitest'

import { calculateCommandCenterMetrics, normalizeRows } from '@/components/hackathon/operations-command-center'

describe('operations command center data model', () => {
  it('normalizes missing or invalid rows to a safe fallback array', () => {
    const fallback = [{ Event_ID: 'HACK-001' }]

    expect(normalizeRows(undefined, fallback)).toEqual(fallback)
    expect(normalizeRows({ rows: [] }, fallback)).toEqual(fallback)
    expect(normalizeRows([null, { Event_ID: 'HACK-002' }, 'invalid'], fallback)).toEqual([{ Event_ID: 'HACK-002' }])
  })

  it('calculates completion, risk, deadline and evidence metrics from rows', () => {
    const now = new Date('2026-10-18T00:00:00.000Z')

    const metrics = calculateCommandCenterMetrics(
      [
        { Event_ID: 'HACK-001', Status: 'In Progress', Deadline_WIB: '2026-10-20T00:00:00.000Z' },
        { Event_ID: 'HACK-002', Status: 'Submitted', Deadline_WIB: '2026-10-25T00:00:00.000Z' }
      ],
      [
        { Task_ID: 'T-001', Status: 'Done', Due_WIB: '2026-10-17T00:00:00.000Z' },
        { Task_ID: 'T-002', Status: 'Blocked', Due_WIB: '2026-10-19T00:00:00.000Z' },
        { Task_ID: 'T-003', Status: 'In Progress', Due_WIB: '2026-10-30T00:00:00.000Z' }
      ],
      [
        { Checklist_ID: 'SC-001', Status: 'Completed', Drive_File_ID: 'drive-file-1' },
        { Checklist_ID: 'SC-002', Status: 'Not Started' }
      ],
      now
    )

    expect(metrics.activeEvents).toBe(1)
    expect(metrics.completedTasks).toBe(1)
    expect(metrics.progress).toBe(33)
    expect(metrics.blockedTasks).toBe(1)
    expect(metrics.overdueTasks).toBe(0)
    expect(metrics.dueSoonTasks).toBe(1)
    expect(metrics.submissionReadiness).toBe(50)
    expect(metrics.missingEvidence).toBe(1)
    expect(metrics.deadlineEvents.map(item => item.row.Event_ID)).toEqual(['HACK-001', 'HACK-002'])
  })
})
