import '@testing-library/jest-dom';

declare global {
  namespace Vi {
    interface Assertion {
      toBeInTheDocument(): void;
      toBeDisabled(): void;
      toHaveAttribute(name: string, value?: string): void;
      toHaveClass(className: string): void;
      toHaveTextContent(text: string | RegExp): void;
      toBeVisible(): void;
      toBeChecked(): void;
      toHaveFocus(): void;
      toBeRequired(): void;
      toBeValid(): void;
      toBeInvalid(): void;
      toBeEmptyDOMElement(): void;
      toHaveValue(value: string | string[] | number | null): void;
      toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): void;
      toBeInTheDOM(): void;
      toHaveStyle(css: Record<string, any>): void;
      toContainElement(element: HTMLElement | null): void;
      toContainHTML(htmlText: string): void;
    }
  }
}
