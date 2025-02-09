// 各レコードの情報の型定義
export interface optionData {
  awsAccountId: string;
  displayName: string;
  color: chrome.tabGroups.ColorEnum;
}

export async function loadOptions (): Promise<optionData[]> {
  const data = await new Promise<{ options?: optionData[] }>((resolve, reject) => {
    chrome.storage.sync.get('options', (result) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      resolve(result);
    });
  });

  return data.options && Array.isArray(data.options) ? data.options : [];
}
