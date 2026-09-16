'use client';

import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import {
  CheckboxList,
  CheckboxListItem,
} from '@astryxdesign/core/CheckboxList';
import { FileInput } from '@astryxdesign/core/FileInput';
import { Grid } from '@astryxdesign/core/Grid';
import { MultiSelector } from '@astryxdesign/core/MultiSelector';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { Selector } from '@astryxdesign/core/Selector';
import { Slider } from '@astryxdesign/core/Slider';
import { Switch } from '@astryxdesign/core/Switch';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

import { NumberInput } from '@/shared/components/number-input.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';

import { ShowcaseSection } from '../showcase-section.jsx';

export function FormsSection() {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(/** @type {number | null} */ (10));
  const [agree, setAgree] = useState(false);
  const [docs, setDocs] = useState(/** @type {string[]} */ (['invoice']));
  const [notify, setNotify] = useState(true);
  const [shipping, setShipping] = useState('standard');
  const [port, setPort] = useState(/** @type {string | null} */ (null));
  const [tags, setTags] = useState(/** @type {string[]} */ ([]));
  const [volume, setVolume] = useState(50);
  const [file, setFile] = useState(/** @type {File | File[] | null} */ (null));

  return (
    <ShowcaseSection
      title="Form"
      description="Toàn bộ input đều cần label thật (không dùng placeholder thay label) — Astryx bắt buộc để đảm bảo a11y."
    >
      <Grid columns={{ minWidth: 260, repeat: 'fit' }} gap={5} width="100%">
        <TextInput
          label="Tên công ty"
          value={name}
          onChange={setName}
          placeholder="VD: Công ty TNHH KT-XNK"
        />
        <TextArea
          label="Ghi chú"
          value={note}
          onChange={setNote}
          placeholder="Ghi chú thêm về đơn hàng..."
          rows={3}
        />
        <NumberInput
          label="Số lượng container"
          value={quantity}
          onChange={setQuantity}
          min={0}
          units="cont"
          hasClear
        />
        <Selector
          label="Cảng đến"
          options={['Cát Lái', 'Hải Phòng', 'Đà Nẵng', 'Quy Nhơn']}
          value={port}
          onChange={setPort}
          placeholder="Chọn cảng..."
          hasClear
        />
        <MultiSelector
          label="Loại chứng từ cần"
          options={[
            { value: 'invoice', label: 'Invoice' },
            { value: 'packing', label: 'Packing list' },
            { value: 'bl', label: 'Bill of Lading' },
            { value: 'co', label: 'C/O' },
          ]}
          value={tags}
          onChange={setTags}
          hasSelectAll
          placeholder="Chọn chứng từ..."
        />
        <RadioList
          label="Phương thức vận chuyển"
          value={shipping}
          onChange={setShipping}
        >
          <RadioListItem label="Đường biển (standard)" value="standard" />
          <RadioListItem label="Đường hàng không" value="air" />
        </RadioList>
        <FileInput
          label="Tải chứng từ"
          value={file}
          onChange={setFile}
          accept=".pdf,.docx"
          description="PDF hoặc Word, tối đa 5MB"
        />
        <Slider
          label="Khối lượng (%)"
          value={volume}
          onChange={setVolume}
          valueDisplay="text"
        />
      </Grid>

      <VStack gap={3}>
        <CheckboxInput
          label="Tôi đồng ý với điều khoản dịch vụ"
          value={agree}
          onChange={setAgree}
        />
        <Switch
          label="Nhận thông báo trạng thái đơn hàng"
          value={notify}
          onChange={setNotify}
        />
        <CheckboxList
          label="Xuất kèm chứng từ"
          value={docs}
          onChange={setDocs}
          hasDividers
        >
          <CheckboxListItem label="Invoice" value="invoice" />
          <CheckboxListItem label="Packing list" value="packing" />
          <CheckboxListItem label="C/O" value="co" />
        </CheckboxList>
      </VStack>
    </ShowcaseSection>
  );
}
