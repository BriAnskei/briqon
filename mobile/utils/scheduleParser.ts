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

// sample usage
// const parserRef = useRef<ScheduleItemParser | null>(null);

// if (!parserRef.current) {
//   parserRef.current = new ScheduleItemParser({
//     onNewItem: (item) => {
//       setItems((prev) => [...prev, item]);
//     },
//     onUpdateItem: (id, field, char) => {
//       setItems((prev) =>
//         prev.map((item) =>
//           item.id === id
//             ? {
//                 ...item,
//                 [field]: (item[field] || "") + char,
//               }
//             : item
//         )
//       );
//     },
//   });
// }

// const handleChunk = (chunk: string) => {
//   parserRef.current?.handleChunk(chunk);
// };

// this will parser an response like this: [
//   {
//     "start_time": "06:00",
//     "end_time": "06:30",
//     "activity": "Wake up, Morning Routine"
//   },
//   {
//     "start_time": "06:30",
//     "end_time": "07:00",
//     "activity": "Breakfast"
//   },
//   {
//     "start_time": "07:00",
//     "end_time": "17:00",
//     "activity": "Work"
//   },
//   {
//     "start_time": "17:00",
//     "end_time": "17:30",
//     "activity": "Travel to Gym"
//   },
//   {
//     "start_time": "17:30",
//     "end_time": "19:30",
//     "activity": "Gym"
//   },
//   {
//     "start_time": "19:30",
//     "end_time": "20:00",
//     "activity": "Dinner"
//   },
//   {
//     "start_time": "20:00",
//     "end_time": "21:30",
//     "activity": "Programming/Upskilling - Session 1"
//   },
//   {
//     "start_time": "21:30",
//     "end_time": "21:45",
//     "activity": "Break"
//   },
//   {
//     "start_time": "21:45",
//     "end_time": "23:00",
//     "activity": "Programming/Upskilling - Session 2"
//   },
//   {
//     "start_time": "23:00",
//     "end_time": "23:30",
//     "activity": "Wind Down/Prepare for Sleep"
//   },
//   {
//     "start_time": "23:30",
//     "end_time": "24:00",
//     "activity": "Sleep"
//   }
