import { ScheduleItem } from "@/type/MessageTypes";

type ScheduleField = keyof Omit<ScheduleItem, "id">;

type ParserCallbacks = {
  onNewItem: (item: ScheduleItem) => void;
  onUpdateItem: (id: string, field: ScheduleField, char: string) => void;
};

export class ScheduleItemParser {
  private onNewItem: ParserCallbacks["onNewItem"];
  private onUpdateItem: ParserCallbacks["onUpdateItem"];

  private currentItem: ScheduleItem | null = null;
  private currentKey: string = "";
  private currentField: ScheduleField | null = null;

  private isReadingKey: boolean = false;
  private isReadingValue: boolean = false;

  private expectingValue = false;

  constructor(callbacks: ParserCallbacks) {
    this.onNewItem = callbacks.onNewItem;
    this.onUpdateItem = callbacks.onUpdateItem;
  }

  private startNewItem() {
    const newItem: ScheduleItem = {
      id: Date.now().toString(),
    };

    this.currentItem = newItem;
    this.onNewItem(newItem);
  }

  private mapKey(key: string): ScheduleField | null {
    switch (key) {
      case "start_time":
        return "startTime";
      case "end_time":
        return "endTime";
      case "activity":
        return "activity";
      default:
        return null;
    }
  }

  // ---- keys
  private startReadingKey() {
    this.isReadingKey = true;
    this.currentKey = "";
  }

  private endReadingKey() {
    this.isReadingKey = false;

    const normalizedKey = this.currentKey
      .replace(/\s+/g, "") // remove ALL whitespace/newlines
      .trim();

    this.currentField = this.mapKey(normalizedKey);

    this.expectingValue = true;
  }

  // ----- value
  private startReadingValues() {
    this.isReadingValue = true;
    this.expectingValue = false;
  }

  private endReadingValues() {
    this.isReadingValue = false;
    this.currentField = null;
  }

  handleChunk(chunk: string) {
    for (const char of chunk) {
      // start object
      if (char === "{") {
        this.startNewItem();

        continue;
      }

      // end object
      if (char === "}") {
        this.currentItem = null;
        continue;
      }

      // ------------------ key start
      if (
        char === '"' &&
        !this.isReadingKey &&
        !this.isReadingValue &&
        !this.expectingValue
      ) {
        this.startReadingKey();
        continue;
      }

      if (char === '"' && this.isReadingKey) {
        this.endReadingKey();

        continue;
      }

      if (this.isReadingKey) {
        this.currentKey += char;

        continue;
      }

      if (char === '"' && this.expectingValue && this.currentField) {
        this.startReadingValues();
        continue;
      }

      if (char === '"' && this.isReadingValue) {
        this.endReadingValues();
        continue;
      }

      if (this.isReadingValue && this.currentItem && this.currentField) {
        if (char === "\n" || char === "\r") return;

        this.onUpdateItem(this.currentItem.id, this.currentField, char);
      }
    }
  }
}
