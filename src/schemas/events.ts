/** 活動記録・研究発表会・国際会議（spec 2.5）。キーの順序は spec の表の順 */
import { z } from 'astro/zod';
import { dateSchema, linkSchema, optionalText, requiredText, timeSchema } from './common';

/** 種類（D-13）。表示ラベルは src/lib 側で持つ（T-07） */
export const EVENT_KINDS = ['activity', 'asj', 'cosponsored', 'international'] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

/** 講演（spec 2.5 talk） */
export const talkSchema = z.object({
  // T-08 既定案: 講演番号は任意入力・自由形式。
  // YAML で `number: 12` と書くと数値になるため、数値は文字列に直して受け付ける
  number: z.preprocess(
    (v) => (typeof v === 'number' ? String(v) : v),
    z.string().trim().optional(),
  ),
  title: requiredText('演題'),
  presenter: requiredText('発表者'),
  hasCoauthors: z.boolean().default(false),
  affiliation: optionalText,
});

/** セッション（spec 2.5 session） */
export const sessionSchema = z
  .object({
    name: requiredText('セッション名'),
    // T-16 既定案: 日付・時刻とも任意。未定なら空欄
    date: dateSchema.optional(),
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
    room: optionalText,
    // T-15 既定案: 座長・副座長は各1名、所属は併記しない（必要なら「氏名（所属）」と書く）
    chair: optionalText,
    viceChair: optionalText,
    talks: z.array(talkSchema).optional(),
  })
  .superRefine((s, ctx) => {
    if (s.startTime !== undefined && s.endTime !== undefined && s.endTime <= s.startTime) {
      ctx.addIssue({
        code: 'custom',
        path: ['endTime'],
        message: '終了時刻は開始時刻より後にしてください',
      });
    }
  });

export const eventSchema = z
  .object({
    kind: z.enum(EVENT_KINDS, { error: '種類を選んでください' }),
    title: requiredText('タイトル'),
    published: dateSchema,
    updated: dateSchema.optional(),
    startDate: dateSchema,
    endDate: dateSchema.optional(),
    // T-14 既定案: 会場は自由記述のみ（オンライン・ハイブリッドの区分は持たない）
    venue: optionalText,
    links: z.array(linkSchema).optional(),
    listInActivities: z.boolean().default(false),
    summary: optionalText,
    sessions: z.array(sessionSchema).optional(),
  })
  .superRefine((e, ctx) => {
    if (e.updated !== undefined && e.updated < e.published) {
      ctx.addIssue({
        code: 'custom',
        path: ['updated'],
        message: '更新日は掲載日以降にしてください',
      });
    }
    if (e.endDate !== undefined && e.endDate < e.startDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: '終了日は開始日以降にしてください',
      });
    }
    const end = e.endDate ?? e.startDate;
    e.sessions?.forEach((s, i) => {
      if (s.date !== undefined && (s.date < e.startDate || s.date > end)) {
        ctx.addIssue({
          code: 'custom',
          path: ['sessions', i, 'date'],
          message: 'セッションの日付は開催期間内にしてください',
        });
      }
    });
  });

export type Talk = z.infer<typeof talkSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type EventData = z.infer<typeof eventSchema>;
