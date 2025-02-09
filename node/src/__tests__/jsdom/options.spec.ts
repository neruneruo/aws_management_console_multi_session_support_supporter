import { optionData } from '@/options/optionStorage';

/**
 * Jest + JSDOM を利用した options.ts のテストコード例
 */

// chrome.storage.sync のモック
const fakeChrome = {
  runtime: { lastError: null },
  storage: {
    sync: {
      get: jest.fn(
        (
          key: string,
          callback: (result: { options?: optionData[] }) => void,
        ) => {
          const result: { options?: optionData[] } = { options: [] };
          callback(result);
        },
      ),
      set: jest.fn((data, callback) => {
        callback();
      }),
    },
  },
};

// グローバルな chrome オブジェクトを定義（TypeScript の型チェックを回避するため any を利用）
(globalThis as any).chrome = fakeChrome;

// テスト内で使用するモック関数などを定義
// index.ts の読み込み時に、上記のモックが利用されるようにするため、chrome の定義後にインポート
// eslint-disable-next-line import/first
import '@/options/options';

// 各テストケースごとに、DOM のセットアップ・外部モジュールのモックを行い、対象モジュールを再読み込みする
describe('options.ts', () => {
  let addOptionsBtn: HTMLElement;
  let saveOptionsBtn: HTMLElement;
  let optionsContainer: HTMLElement;
  let popupDialog: HTMLDialogElement;
  let popupMessage: HTMLElement;
  let popupClose: HTMLElement;

  beforeEach(() => {
    // テスト用のDOMをセットアップ
    document.body.innerHTML = `
      <div id="optionsContainer"></div>
      <button id="addOptionsBtn">Add Option</button>
      <button id="saveOptionsBtn">Save Option</button>
      <dialog id="popupDialog">
        <p id="popupMessage"></p>
        <button id="popupClose">Close</button>
      </dialog>
    `;

    // モジュールキャッシュをリセットして、options.ts の初期化処理が毎回実行されるようにする
    jest.resetModules();

    // DOMContentLoaded イベントを発火し、options.ts 内の初期化処理（イベントリスナの登録、保存済み設定のロードなど）を実行させる
    document.dispatchEvent(new Event('DOMContentLoaded'));

    // 各DOM要素の参照を取得
    optionsContainer = document.getElementById('optionsContainer')!;
    addOptionsBtn = document.getElementById('addOptionsBtn')!;
    saveOptionsBtn = document.getElementById('saveOptionsBtn')!;
    popupDialog = document.getElementById('popupDialog') as HTMLDialogElement;
    popupMessage = document.getElementById('popupMessage') as HTMLParagraphElement;
    popupClose = document.getElementById('popupClose') as HTMLButtonElement;

    // popupDialog の showModal/close をモック化（JSDOM では未実装のため）
    popupDialog.showModal = jest.fn();
    popupDialog.close = jest.fn();
    // window.close もモック化
    window.close = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should add an option when addOptionsBtn is clicked', () => {
    expect(optionsContainer.children.length).toBe(0);

    // 「レコードを追加」ボタンをクリックすると option が追加される
    addOptionsBtn.click();

    expect(optionsContainer.children.length).toBe(1);
    const optionDiv = optionsContainer.querySelector('.option');
    expect(optionDiv).not.toBeNull();
  });

  test('should remove an option when delete button is clicked', () => {
    // まず option を追加
    addOptionsBtn.click();
    expect(optionsContainer.children.length).toBe(1);
    const optionDiv = optionsContainer.querySelector('.option') as HTMLElement;
    // option 内に作成された削除ボタン（クラス名 "delete-btn"）を取得してクリック
    const deleteBtn = optionDiv.querySelector('.delete-btn') as HTMLElement;
    deleteBtn.click();
    expect(optionsContainer.children.length).toBe(0);
  });

  test('should show popup when maximum options reached', () => {
    // maxOptions は 10 のため、10件追加できるはず
    for (let i = 0; i < 10; i++) {
      addOptionsBtn.click();
    }
    expect(optionsContainer.children.length).toBe(10);
    // 11回目の追加時にはポップアップが表示され、新たな option は追加されない
    addOptionsBtn.click();
    expect(optionsContainer.children.length).toBe(10);
    expect(popupMessage.textContent).toBe('設定可能な上限に達しました。');
    expect(popupDialog.showModal).toHaveBeenCalled();
  });

  test('should update select style on color change', () => {
    addOptionsBtn.click();
    const optionDiv = optionsContainer.querySelector('.option') as HTMLElement;
    const select = optionDiv.querySelector('select') as HTMLSelectElement;

    // 初期状態では、selectedColor が空文字のため、通常は先頭（"yellow"）が選択される
    expect(select.selectedIndex).toBe(0);
    expect(select.classList.contains('yellow')).toBe(true);

    // 選択肢を "green" に変更し、change イベントを発火
    select.value = 'green';
    select.dispatchEvent(new Event('change'));

    // select 要素のクラスが "green" に更新されていることを確認
    expect(select.classList.contains('green')).toBe(true);
    expect(select.classList.contains('red')).toBe(false);
  });

  test('should save options to chrome.storage.sync and close window when saveOptionsBtn is clicked', () => {
    // まず option を追加し、各 input/select に値を設定
    addOptionsBtn.click();
    const optionDiv = optionsContainer.querySelector('.option') as HTMLElement;
    const inputs = optionDiv.getElementsByTagName('input');
    const select = optionDiv.getElementsByTagName('select')[0] as HTMLSelectElement;
    inputs[0].value = '111122223333';
    inputs[1].value = 'My Account';
    select.value = 'blue';
    select.dispatchEvent(new Event('change'));

    // 「保存」ボタンをクリックすると、chrome.storage.sync.set が呼ばれ、window.close() も実行される
    saveOptionsBtn.click();
    expect(fakeChrome.storage.sync.set).toHaveBeenCalledWith(
      {
        options: [{
          awsAccountId: '111122223333', displayName: 'My Account', color: 'blue',
        }],
      },
      expect.any(Function),
    );
    expect(window.close).toHaveBeenCalled();
  });

  test('should load options from loadOptions and create records', async () => {
    (chrome.storage.sync.get as jest.Mock).mockImplementationOnce((key, callback) => {
      const result: { options?: optionData[] } = {
        options: [{
          awsAccountId: '999999999999',
          displayName: 'Loaded Account',
          color: 'green',
        }],
      };
      callback(result);
    });

    document.dispatchEvent(new Event('DOMContentLoaded'));

    // 非同期処理（loadOptions の await 処理）を待つため、少し待機
    await new Promise((resolve) => setTimeout(resolve, 0));

    const optionDivs = optionsContainer.querySelectorAll('.option');
    expect(optionDivs.length).toBe(1);
    const optionDiv = optionDivs[0];
    const inputs = optionDiv.getElementsByTagName('input');
    const select = optionDiv.getElementsByTagName('select')[0] as HTMLSelectElement;
    expect(inputs[0].value).toBe('999999999999');
    expect(inputs[1].value).toBe('Loaded Account');
    expect(select.value).toBe('green');
  });

  test('should close popup when popupClose is clicked', () => {
    // ポップアップを手動で表示状態にする
    popupDialog.showModal();
    // popupClose ボタンをクリックすると、popupDialog.close() が呼ばれる
    popupClose.click();
    expect(popupDialog.close).toHaveBeenCalled();
  });
});
