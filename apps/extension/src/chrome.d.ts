declare namespace chrome {
  namespace storage {
    interface StorageArea {
      get(keys?: string | string[] | Record<string, unknown> | null): Promise<Record<string, unknown>>;
      set(items: Record<string, unknown>): Promise<void>;
    }

    const sync: StorageArea;
    const local: StorageArea;
  }

  namespace runtime {
    interface RuntimeError {
      message?: string;
    }

    interface MessageSender {
      tab?: tabs.Tab;
    }

    const lastError: RuntimeError | undefined;

    function sendMessage(message: unknown, responseCallback: (response: unknown) => void): void;
    function openOptionsPage(callback?: () => void): void;

    const onMessage: {
      addListener(
        callback: (
          message: unknown,
          sender: MessageSender,
          sendResponse: (response?: unknown) => void
        ) => boolean | void
      ): void;
    };
  }

  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
    }

    function query(queryInfo: { active?: boolean; currentWindow?: boolean }): Promise<Tab[]>;
    function sendMessage(tabId: number, message: unknown): Promise<unknown>;
  }

  namespace notifications {
    function create(options: {
      type: "basic";
      iconUrl: string;
      title: string;
      message: string;
    }): Promise<string>;
  }
}
