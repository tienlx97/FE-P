'use client';

import { InputGroup, InputGroupText } from '@astryxdesign/core/InputGroup';
import { TextInput } from '@astryxdesign/core/TextInput';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import {
  formatNumberInput,
  numberValueToInput,
  parseNumberInput,
} from '@/shared/config/formatted-number-input.js';

const styles = stylex.create({
  fullWidth: {
    width: '100%',
  },
});

/**
 * Common Astryx TextInput adapter for non-negative numeric values. The UI
 * keeps an editable text draft while forms and APIs continue to receive a
 * clean number or undefined.
 * @param {{
 *   label: string,
 *   value: number | undefined,
 *   onChange: (value: number | undefined) => void,
 *   units?: string,
 *   description?: string,
 *   isLabelHidden?: boolean,
 *   isRequired?: boolean,
 *   isReadOnly?: boolean,
 *   isDisabled?: boolean,
 *   size?: 'sm' | 'md' | 'lg',
 *   status?: { type: 'error' | 'warning' | 'success', message?: string },
 *   statusVariant?: 'attached' | 'detached' | 'tooltip',
 * }} props
 */
export function FormattedNumberTextInput({
  label,
  value,
  onChange,
  units,
  description,
  isLabelHidden = false,
  isRequired = false,
  isReadOnly = false,
  isDisabled = false,
  size = 'md',
  status,
  statusVariant = 'tooltip',
}) {
  const [inputState, setInputState] = useState(() => ({
    externalValue: value,
    draft: numberValueToInput(value),
  }));
  let draft = inputState.draft;

  if (!Object.is(inputState.externalValue, value)) {
    draft = Object.is(parseNumberInput(draft), value)
      ? draft
      : numberValueToInput(value);
    setInputState({ externalValue: value, draft });
  }

  /** @param {string} rawValue */
  const handleChange = (rawValue) => {
    const formattedValue = formatNumberInput(rawValue);
    setInputState({ externalValue: value, draft: formattedValue });
    onChange(parseNumberInput(formattedValue));
  };

  const input = (
    <TextInput
      label={label}
      isLabelHidden={units ? true : isLabelHidden}
      value={draft}
      onChange={handleChange}
      placeholder="0.00"
      description={units ? undefined : description}
      isRequired={isRequired}
      isReadOnly={isReadOnly}
      isDisabled={isDisabled}
      size={size}
      status={units ? undefined : status}
      statusVariant={statusVariant}
      width="100%"
    />
  );

  if (!units) return input;

  return (
    <InputGroup
      label={label}
      isLabelHidden={isLabelHidden}
      description={description}
      isRequired={isRequired}
      size={size}
      status={status}
      xstyle={styles.fullWidth}
    >
      {input}
      <InputGroupText>{units}</InputGroupText>
    </InputGroup>
  );
}
