declare module "split-type" {
  interface SplitTypeOptions {
    types?: string;
    tagName?: string;
    absolute?: boolean;
    split?: string;
    position?: string;
    lineClass?: string;
    wordClass?: string;
    charClass?: string;
  }

  interface SplitTypeInstance {
    chars: HTMLElement[] | null;
    words: HTMLElement[] | null;
    lines: HTMLElement[] | null;
    elements: HTMLElement[];
    isSplit: boolean;
    revert(): void;
  }

  export default class SplitType {
    constructor(
      target: string | HTMLElement | NodeList | HTMLElement[],
      options?: SplitTypeOptions
    );

    static create(
      target: string | HTMLElement | NodeList | HTMLElement[],
      options?: SplitTypeOptions
    ): SplitTypeInstance;

    chars: HTMLElement[] | null;
    words: HTMLElement[] | null;
    lines: HTMLElement[] | null;
    elements: HTMLElement[];
    isSplit: boolean;
    revert(): void;
  }
}
