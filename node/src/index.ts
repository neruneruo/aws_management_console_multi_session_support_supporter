import { optionData, loadOptions } from '@/options/optionStorage';
import { colorPallette } from '@/globals/colorPallette';

// オプションの読み込み
// 設定更新でリロードするため、letで宣言する
let options: optionData[] = [];
(async () => {
  options = await loadOptions();
})();

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.options) {
    options = changes.options.newValue || [];
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    // AWSのマルチセッションサポートのマネージメントコンソールに入ったらタブグループの操作を行う

    if (changeInfo.url && changeInfo.url.search(/^https:\/\/[0-9]{12}-.{8}\..*\.console\.aws\.amazon\.com\//) >= 0) {
      try {
        // URLからAWSアカウントIDを抽出
        const awsAccountId = changeInfo.url.match(/^https:\/\/([0-9]{12})-.{8}\..*\.console\.aws\.amazon\.com\//);

        // AWSアカウントIDがオプション設定と一致するかを確認
        let matchOption: optionData | null = null;
        for (const option of options) {
          if (option.awsAccountId === awsAccountId![1]) {
            // 一致したら表示名を保持
            matchOption = option;
            break;
          }
        }

        // 既存のタブグループの表示名を検索
        const groups = await chrome.tabGroups.query({});

        const existingGroup = groups.find((g) => g.title === (matchOption ? matchOption.displayName : awsAccountId![1]));

        if (existingGroup !== undefined) {
          // 表示名と同じタブグループが存在する場合、タブグループにタブを追加

          await chrome.tabs.group({
            groupId: existingGroup.id,
            tabIds: [tabId],
          });
        } else if (existingGroup === undefined && matchOption) {
          // 表示名と同じタブグループが存在しないが、オプションと一致する場合、オプション設定の情報を元にタブグループを作成
          const newGroupId = await chrome.tabs.group({ tabIds: [tabId] });
          await chrome.tabGroups.update(newGroupId, {
            title: matchOption.displayName,
            color: matchOption.color,
          });
        } else {
          // 表示名と同じタブグループが存在せず、オプションとも一致しない場合、色を自動で設定しながら新規にタブグループを作成
          const colorCheckGroups = await chrome.tabGroups.query({});

          // 既に色が使われているかの確認
          for (const color of colorPallette) {
            let existFlg = false;
            for (const colorCheckGroup of colorCheckGroups) {
              if (colorCheckGroup.color === color && color !== 'grey') {
                existFlg = true;
                break;
              }
            }

            if (existFlg === true) {
              // 既に色が使われていたら次の色
              continue;
            } else {
              // 既にgreyまで色が使われていたら重複を許容
              const newGroupId = await chrome.tabs.group({ tabIds: [tabId] });
              await chrome.tabGroups.update(newGroupId, {
                title: awsAccountId![1],
                color: color,
              });

              break;
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // AWSのマルチセッションサポートのマネージメントコンソールから離れたらグループから外す
      // changeInfo.url が undefinedになることがあるので、遷移したときだけフックする
      if (changeInfo.url) {
        const tab = await chrome.tabs.get(tabId);
        if (tab.groupId !== -1) {
          chrome.tabs.ungroup(tabId);
        }
      }
    }
  }
});
