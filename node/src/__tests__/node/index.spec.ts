import { optionData } from '@/options/optionStorage';

// __tests__/index.spec.ts

let capturedOnUpdatedCallback: (tabId: number, changeInfo: any, tab: any) => Promise<void>;

// chrome の各 API をモック化したオブジェクト
const fakeChrome = {
  runtime: { lastError: null },
  tabs: {
    // onUpdated の addListener で渡されたコールバックを捕捉
    onUpdated: {
      addListener: jest.fn(
        (callback: (tabId: number, changeInfo: any, tab: any) => Promise<void>) => {
          capturedOnUpdatedCallback = callback;
        },
      ),
    },
    group: jest.fn(),
    get: jest.fn(),
    ungroup: jest.fn(),
  },
  tabGroups: {
    query: jest.fn(),
    update: jest.fn(),
  },
  storage: {
    sync: {
      get: jest.fn(
        (
          key: string,
          callback: (result: { options?: optionData[] }) => void,
        ) => {
          if (key === 'options') {
            const result: { options?: optionData[] } = {
              options: [{
                awsAccountId: '123456789012',
                displayName: 'TestAccount',
                color: 'blue',
              }],
            };
            callback(result);
          } else {
            const result: { options?: optionData[] } = { options: [] };
            callback(result);
          }
        }),
      set: jest.fn((data: any, callback?: () => void) => {
        if (callback) callback();
      }),
    },
    onChanged: { addListener: jest.fn() },
  },
};

// グローバルな chrome オブジェクトを定義（TypeScript の型チェックを回避するため any を利用）
(globalThis as any).chrome = fakeChrome;

// テスト内で使用するモック関数などを定義
// index.ts の読み込み時に、上記のモックが利用されるようにするため、chrome の定義後にインポート
// eslint-disable-next-line import/first
import '../../index';

describe('index.ts', () => {
  beforeEach(() => {
    // 各テスト実行前にモックの呼び出し履歴などをクリア
    jest.resetAllMocks();
  });

  test('AWS管理コンソールのURLで、既存グループがあればタブをそのグループに追加する/オプションの設定と不一致', async () => {
    const tabId = 1;
    const tabGroupId = tabId * 100;
    // 正規表現にマッチする AWS 管理コンソールの URL
    const awsUrl = 'https://111111111111-abcdefgh.some-region.console.aws.amazon.com/';
    const changeInfo = {
      status: 'loading', url: awsUrl,
    };
    const tab = {}; // テスト内ではタブオブジェクトの詳細は不要

    // 既存グループ検索: タイトルが AWS アカウントIDと一致するグループを返す
    fakeChrome.tabGroups.query.mockResolvedValueOnce([{
      id: tabGroupId, title: '111111111111',
    }]);

    await capturedOnUpdatedCallback(tabId, changeInfo, tab);

    // 既存グループが見つかった場合は、group() に groupId を指定してタブが追加される
    expect(fakeChrome.tabs.group).toHaveBeenCalledWith({
      tabIds: [tabId], groupId: tabGroupId,
    });
  });

  test('AWS管理コンソールのURLで、既存グループがあればタブをそのグループに追加する/オプションの設定と一致', async () => {
    const tabId = 2;
    const tabGroupId = tabId * 100;
    // 正規表現にマッチする AWS 管理コンソールの URL
    const awsUrl = 'https://123456789012-abcdefgh.some-region.console.aws.amazon.com/';
    const changeInfo = {
      status: 'loading', url: awsUrl,
    };
    const tab = {}; // テスト内ではタブオブジェクトの詳細は不要

    // 既存グループ検索: タイトルが AWS アカウントIDと一致するグループを返す
    fakeChrome.tabGroups.query.mockResolvedValueOnce([{
      id: tabGroupId, title: 'TestAccount',
    }]);

    await capturedOnUpdatedCallback(tabId, changeInfo, tab);

    // 既存グループが見つかった場合は、group() に groupId を指定してタブが追加される
    expect(fakeChrome.tabs.group).toHaveBeenCalledWith({
      tabIds: [tabId], groupId: tabGroupId,
    });
  });

  test('AWS管理コンソールのURLで、既存グループがなければ新規グループを作成する/オプションの設定と不一致', async () => {
    const tabId = 3;
    const tabGroupId = tabId * 100;
    const awsUrl = 'https://111111111111-ijklmnop.some-region.console.aws.amazon.com/';
    const changeInfo = {
      status: 'loading',
      url: awsUrl,
    };
    const tab = {};

    // 1回目の query(): 既存グループが存在しない
    fakeChrome.tabGroups.query.mockResolvedValueOnce([]);
    // 2回目の query(): 色の使用状況を確認するため、今回はどの色も使われていないとする
    fakeChrome.tabGroups.query.mockResolvedValueOnce([]);
    // 新規グループ作成時、group() はグループIDを返す（例: 300）
    fakeChrome.tabs.group.mockResolvedValueOnce(tabGroupId);

    await capturedOnUpdatedCallback(tabId, changeInfo, tab);

    // 新規グループ作成の場合、group() は groupId 指定なしで呼ばれる
    expect(fakeChrome.tabs.group).toHaveBeenCalledWith({ tabIds: [tabId] });

    // カラーパレットの最初の未使用色（この例では 'yellow'）を利用し、update() によってタイトルと色が設定される
    expect(fakeChrome.tabGroups.update).toHaveBeenCalledWith(
      tabGroupId,
      {
        title: '111111111111',
        color: 'yellow',
      });
  });

  test('AWS管理コンソールのURLで、既存グループがなければ新規グループを作成する/オプションの設定と一致', async () => {
    const tabId = 4;
    const tabGroupId = tabId * 100;
    const awsUrl = 'https://123456789012-ijklmnop.some-region.console.aws.amazon.com/';
    const changeInfo = {
      status: 'loading',
      url: awsUrl,
    };
    const tab = {};

    // 1回目の query(): 既存グループが存在しない
    fakeChrome.tabGroups.query.mockResolvedValueOnce([]);
    // 2回目の query(): 色の使用状況を確認するため、今回はどの色も使われていないとする
    fakeChrome.tabGroups.query.mockResolvedValueOnce([]);
    // 新規グループ作成時、group() はグループIDを返す（例: 300）
    fakeChrome.tabs.group.mockResolvedValueOnce(tabGroupId);

    await capturedOnUpdatedCallback(tabId, changeInfo, tab);

    // 新規グループ作成の場合、group() は groupId 指定なしで呼ばれる
    expect(fakeChrome.tabs.group).toHaveBeenCalledWith({ tabIds: [tabId] });

    // カラーパレットの最初の未使用色（この例では 'yellow'）を利用し、update() によってタイトルと色が設定される
    expect(fakeChrome.tabGroups.update).toHaveBeenCalledWith(
      tabGroupId,
      {
        title: 'TestAccount',
        color: 'blue',
      });
  });

  test('AWS管理コンソールのURLで、既存グループがなければ新規グループを作成する - 別のカラーを選択', async () => {
    const tabId = 5;
    const tabGroupId = tabId * 100;
    const awsUrl = 'https://111111111111-ijklmnop.some-region.console.aws.amazon.com/';
    const changeInfo = {
      status: 'loading', url: awsUrl,
    };
    const tab = {};

    fakeChrome.tabGroups.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ color: 'yellow' }]);
    fakeChrome.tabs.group.mockResolvedValueOnce(tabGroupId);

    await capturedOnUpdatedCallback(tabId, changeInfo, tab);

    expect(fakeChrome.tabs.group).toHaveBeenCalledWith({ tabIds: [tabId] });
    expect(fakeChrome.tabGroups.update).toHaveBeenCalledWith(
      tabGroupId,
      {
        title: '111111111111',
        color: 'blue',
      });
  });

  test('AWS管理コンソール以外のURLの場合、タブがグループに所属していれば ungroup する', async () => {
    const tabId = 6;
    // const tabGroupId = tabId * 100;
    const nonAwsUrl = 'https://example.com/';
    const changeInfo = {
      status: 'loading', url: nonAwsUrl,
    };

    // 非 AWS の場合は、chrome.tabs.get() を利用してタブ情報を取得し、groupId が -1 でない場合に ungroup する
    fakeChrome.tabs.get.mockResolvedValueOnce({ groupId: 10 });

    await capturedOnUpdatedCallback(tabId, changeInfo, {});

    expect(fakeChrome.tabs.ungroup).toHaveBeenCalledWith(tabId);
  });

  test('AWS管理コンソール以外のURLの場合、タブがグループ未所属なら ungroup しない', async () => {
    const tabId = 7;
    // const tabGroupId = tabId * 100;
    const nonAwsUrl = 'https://example.com/';
    const changeInfo = {
      status: 'loading', url: nonAwsUrl,
    };

    // タブがグループ未所属の場合は、groupId が -1 として返す
    fakeChrome.tabs.get.mockResolvedValueOnce({ groupId: -1 });

    await capturedOnUpdatedCallback(tabId, changeInfo, {});

    expect(fakeChrome.tabs.ungroup).not.toHaveBeenCalled();
  });

  test('changeInfo.status が "loading" でない場合は何も処理しない', async () => {
    const tabId = 8;
    // const tabGroupId = tabId * 100;
    const awsUrl = 'https://123456789012-abcdefgh.some-region.console.aws.amazon.com/';
    // status が 'complete' の場合、処理対象外となる
    const changeInfo = {
      status: 'complete', url: awsUrl,
    };
    const tab = {};

    await capturedOnUpdatedCallback(tabId, changeInfo, tab);

    // いずれの chrome API も呼ばれていないことを確認
    expect(fakeChrome.tabs.group).not.toHaveBeenCalled();
    expect(fakeChrome.tabGroups.query).not.toHaveBeenCalled();
    expect(fakeChrome.tabs.get).not.toHaveBeenCalled();
    expect(fakeChrome.tabs.ungroup).not.toHaveBeenCalled();
    expect(fakeChrome.tabGroups.update).not.toHaveBeenCalled();
  });

  test('try ブロック内で例外が発生した場合、console.error にエラーが出力される', async () => {
    const tabId = 9;
    // const tabGroupId = tabId * 100;
    const awsUrl = 'https://123456789012-abcdefgh.some-region.console.aws.amazon.com/';
    const changeInfo = {
      status: 'loading', url: awsUrl,
    };
    const tab = {};

    // query() の呼び出しでエラーを発生させる
    const error = new Error('Query error');
    fakeChrome.tabGroups.query.mockRejectedValueOnce(error);

    // console.error をスパイして、呼び出しを検証する
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await capturedOnUpdatedCallback(tabId, changeInfo, tab);

    expect(consoleErrorSpy).toHaveBeenCalledWith(error);

    consoleErrorSpy.mockRestore();
  });
});
