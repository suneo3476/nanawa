import { type Live } from '../live'

describe('Live type', () => {
  it('should create a valid live object', () => {
    const live: Live = {
      liveId: 'live_001',
      name: '七輪ライブ2024春',
      date: '2024-03-20',
      venue: 'スタジオペンタ',
      memo: '春のスペシャルライブ'
    }

    expect(live.liveId).toBe('live_001')
    expect(live.name).toBe('七輪ライブ2024春')
    expect(live.date).toBe('2024-03-20')
    expect(live.venue).toBe('スタジオペンタ')
    expect(live.memo).toBe('春のスペシャルライブ')
  })

  // 必須フィールドの検証
  it('should not allow missing required fields', () => {
    // @ts-expect-error: liveId is required
    const invalidLive: Live = {
      name: '七輪ライブ2024春',
      date: '2024-03-20',
      venue: 'スタジオペンタ',
      memo: '春のスペシャルライブ'
    }

    expect(invalidLive).toBeDefined()
  })
})
