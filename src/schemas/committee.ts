/** 運営委員名簿（spec 2.6）。キーの順序は spec の表の順 */
import { z } from 'astro/zod';
import { ALWAYS_REFINE, dateSchema, isDateValue, optionalText, requiredText } from './common';

// T-27 既定案: 名簿は役職・氏名・所属の3列のみ。年度途中の交代などは本文の補足に書く
export const memberSchema = z.object({
  role: requiredText('役職'),
  name: requiredText('氏名'),
  affiliation: optionalText,
});

export const committeeSchema = z
  .object({
    fiscalYear: z
      .number({ error: '年度を西暦の数字で入力してください' })
      .int({ error: '年度は整数で入力してください' })
      .min(1900, { error: '年度は西暦で入力してください' })
      .max(2999, { error: '年度は西暦で入力してください' }),
    published: dateSchema,
    updated: dateSchema.optional(),
    members: z.array(memberSchema).min(1, { error: '名簿に1名以上入力してください' }),
  })
  .superRefine((c, ctx) => {
    if (isDateValue(c.updated) && isDateValue(c.published) && c.updated < c.published) {
      ctx.addIssue({
        code: 'custom',
        path: ['updated'],
        message: '更新日は掲載日以降にしてください',
      });
    }
  }, ALWAYS_REFINE);

export type Member = z.infer<typeof memberSchema>;
export type CommitteeData = z.infer<typeof committeeSchema>;
