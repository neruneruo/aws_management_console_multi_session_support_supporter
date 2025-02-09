import { optionData, loadOptions } from '@/options/optionStorage';
import { colorPallette } from '@/globals/colorPallette';

document.addEventListener('DOMContentLoaded', () => {
  const optionsContainer = document.getElementById('optionsContainer')!;
  const addOptionsBtn = document.getElementById('addOptionsBtn')!;
  const saveOptionsBtn = document.getElementById('saveOptionsBtn')!;
  let optionCount = 0;
  const maxOptions = 10;

  // ポップアップダイアログの参照
  const popupDialog = document.getElementById('popupDialog') as HTMLDialogElement;
  const popupMessage = document.getElementById('popupMessage') as HTMLParagraphElement;
  const popupClose = document.getElementById('popupClose') as HTMLButtonElement;

  // ダイアログを閉じるイベント
  popupClose.addEventListener('click', () => {
    popupDialog.close();
  });

  function showPopup (message: string): void {
    popupMessage.textContent = message;
    popupDialog.showModal();
  }

  /**
     * レコードを追加する関数
     * @param awsAccountId AWSアカウントID（初期値は空文字）
     * @param displayName 表示名（初期値は空文字）
     * @param selectedColor 初期選択色（初期値は空文字）
     */
  function addOption (
    awsAccountId: string = '',
    displayName: string = '',
    selectedColor: string = '',
  ): void {
    if (optionCount >= maxOptions) {
      showPopup('設定可能な上限に達しました。');
      return;
    }
    optionCount++;

    // レコードのコンテナを作成
    const optionDiv: HTMLDivElement = document.createElement('div');
    optionDiv.classList.add('option');

    // AWSアカウントID入力用テキストボックス
    const awsInput: HTMLInputElement = document.createElement('input');
    awsInput.type = 'text';
    awsInput.placeholder = 'AWSアカウントID';
    awsInput.value = awsAccountId;

    // 表示名入力用テキストボックス
    const nameInput: HTMLInputElement = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = '表示名';
    nameInput.value = displayName;

    // 色指定用プルダウン
    const colorSelect: HTMLSelectElement = document.createElement('select');
    colorPallette.forEach((color: string): void => {
      const option: HTMLOptionElement = document.createElement('option');
      option.value = color;
      option.textContent = color;

      // CSSによる背景色と文字色の設定
      option.classList.add(color);

      if (color === selectedColor) {
        option.selected = true;
      }
      colorSelect.appendChild(option);
    });

    // 選択されたオプションのクラスを <select> 要素に反映してスタイルを更新する関数
    function updateSelectStyle (select: HTMLSelectElement): void {
      // 対象の色クラスのリスト（options と select 両方に適用する）
      // select 要素からすべての色クラスを削除
      colorPallette.forEach(cls => select.classList.remove(cls));

      // 選択された option を取得し、最初のクラス（色名）を select に付与
      const selectedOption = select.options[select.selectedIndex];
      if (selectedOption && selectedOption.classList.length > 0) {
        const selectedClass = selectedOption.classList.item(0);
        if (selectedClass) {
          select.classList.add(selectedClass);
        }
      }
    }

    // 初期状態でスタイルを更新
    updateSelectStyle(colorSelect);
    // 選択が変化したときにスタイルを更新
    colorSelect.addEventListener('change', () => {
      updateSelectStyle(colorSelect);
    });

    // レコード削除用の「×」ボタン
    const deleteBtn: HTMLSpanElement = document.createElement('span');
    deleteBtn.textContent = '×';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.addEventListener('click', () => {
      optionsContainer.removeChild(optionDiv);
      optionCount--;
    });

    // 各要素をレコードのコンテナに追加
    optionDiv.appendChild(awsInput);
    optionDiv.appendChild(nameInput);
    optionDiv.appendChild(colorSelect);
    optionDiv.appendChild(deleteBtn);

    // レコードを表示領域に追加
    optionsContainer.appendChild(optionDiv);
  }

  // chrome.storage から保存済みの設定を読み込み、各レコードを再生成
  (async () => {
    const options: optionData[] = await loadOptions();
    options.forEach((option: optionData) => {
      addOption(option.awsAccountId, option.displayName, option.color);
    });
  })();

  // 「レコードを追加」ボタンのクリックイベント
  addOptionsBtn.addEventListener('click', () => {
    addOption();
  });

  saveOptionsBtn.addEventListener('click', () => {
    // 各レコードの情報を集める
    const options: optionData[] = [];
    const optionDivs = optionsContainer.querySelectorAll('.option');
    optionDivs.forEach((optionDiv) => {
      // 各レコード内の input 要素（AWSアカウントIDと表示名）と select 要素を取得
      const inputs = optionDiv.getElementsByTagName('input');
      const select = optionDiv.getElementsByTagName('select')[0] as HTMLSelectElement;
      if (inputs.length >= 2 && select) {
        const awsAccountId = inputs[0].value;
        const displayName = inputs[1].value;
        const color = select.value as chrome.tabGroups.ColorEnum;
        options.push({
          awsAccountId, displayName, color,
        });
      }
    });

    // chrome.storage.sync に設定を保存する
    chrome.storage.sync.set({ options }, () => {
      // 保存完了後のコールバック（保存完了の通知後、オプションページを閉じるなど）
      window.close();
    });
  });
});
