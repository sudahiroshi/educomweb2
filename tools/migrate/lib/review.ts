/** 要確認リスト（docs/migration/review.md、plan 9.9）に載せる項目を集める */

export interface ReviewItem {
  /** 生成したファイル（src/content/ からのパス）。ファイルを作らなかったものは旧サイトのパス */
  target: string;
  /** 何を確認するか */
  message: string;
}

export class Review {
  readonly items: ReviewItem[] = [];

  add(target: string, message: string): void {
    this.items.push({ target, message });
  }
}
