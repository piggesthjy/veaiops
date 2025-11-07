// Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. and/or its affiliates
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
  type PropsWithChildren,
} from 'react';

type SubscribeFunc<T> = (callback: (data: T) => void) => () => void;
type UnsubscribeFunc = (id: number) => void;
type PublishFunc<T> = (data: T) => void;

// 引入泛型
interface ISubscription<T> {
  subscribe: SubscribeFunc<T>;
  unsubscribe: UnsubscribeFunc;
  publish: PublishFunc<T>;
}

// channels 类型也需要修改，每个 channel 的数据类型可以不同
export interface ChannelType {
  // mttr时间轴
  mttrTimeLines?: ISubscription<Record<string, string>>;
  // activeKey变化通道
  activeKeyChange?: ISubscription<Record<string, unknown>>;
}

type ChannelKeys = keyof ChannelType;
type InferSubscribeFuncArg<T> = T extends PublishFunc<infer U> ? U : unknown;

const Index = createContext<ChannelType>({} as ChannelType);

export const SubscriptionProvider: React.FC<PropsWithChildren<unknown>> = ({
  children,
}) => {
  const [channels] = useState<ChannelType>(() => {
    return {} as ChannelType;
  });

  useEffect(() => {
    return () => undefined;
  }, [channels]);

  return <Index.Provider value={channels}>{children}</Index.Provider>;
};

// 把创建通道的函数也暴露出去
export const useSubscription = (): {
  channels: ChannelType;
  createChannel: <T extends ChannelKeys>(channelName: T) => void;
} => {
  const channels = useContext(Index);
  const [, updateState] = useState<unknown>();
  const forceUpdate: Dispatch<SetStateAction<unknown>> = React.useCallback(
    () => updateState({}),
    [],
  );

  useEffect(() => {
    forceUpdate({});
  }, [channels, forceUpdate]);

  const createChannel = <T extends ChannelKeys>(channelName: T) => {
    type DataType = InferSubscribeFuncArg<ChannelType[T]>;

    if (channels[channelName]) {
      return;
    }

    let subscriptions: Record<number, (data: DataType) => void> = {};
    const unsubscribe: UnsubscribeFunc = (id) => {
      delete subscriptions[id];
    };

    const subscribe: SubscribeFunc<DataType> = (callback) => {
      const id = Math.random();
      subscriptions = { ...subscriptions, [id]: callback };

      return () => unsubscribe(id);
    };

    const publish: (data: DataType) => void = (data) => {
      Object.values(subscriptions).forEach((callback) => {
        if (callback) {
          callback(data);
        }
      });
    };

    channels[channelName] = {
      subscribe,
      unsubscribe,
      publish,
    } as any;
  };

  return { channels, createChannel };
};
