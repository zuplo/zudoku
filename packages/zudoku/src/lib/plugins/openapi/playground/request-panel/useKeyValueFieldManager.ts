import {
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type {
  FieldArrayPath,
  FieldArrayWithId,
  FieldValues,
  PathValue,
} from "react-hook-form";
import { type useFieldArray, useFormContext } from "react-hook-form";

export type KeyValueField = {
  name: string;
  value: string | number | readonly string[] | undefined;
  active: boolean;
};

export type KeyValueFieldManagerOptions<
  TFormData extends FieldValues,
  TName extends FieldArrayPath<TFormData>,
  T extends KeyValueField = PathValue<TFormData, TName>[number],
> = {
  fieldArray: ReturnType<typeof useFieldArray<TFormData, TName>>;
  name: TName;
  defaultValue: T;
  isEmpty?: (item: T) => boolean;
  shouldSetActive?: (item: T) => boolean;
};

export type CheckboxProps = {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export type RemoveButtonProps = { onClick: () => void; disabled?: boolean };

type SetValueFn = (
  index: number,
  field: keyof KeyValueField,
  value: string | File | boolean | readonly string[] | undefined,
  options?: { focus?: "next" | "previous" },
) => void;

type GetValueFn = (
  index: number,
  field: keyof KeyValueField,
) => string | File | number | readonly string[] | boolean | undefined;

export type UseKeyValueFieldManagerReturn<
  TFormData extends FieldValues,
  TName extends FieldArrayPath<TFormData>,
> = {
  fields: FieldArrayWithId<TFormData, TName, "id">[];
  getNameInputProps: (index: number) => ComponentPropsWithoutRef<"input">;
  getValueInputProps: (index: number) => ComponentPropsWithoutRef<"input">;
  getCheckboxProps: (index: number) => CheckboxProps;
  getRemoveButtonProps: (index: number) => RemoveButtonProps;
  setValue: SetValueFn;
  getValue: GetValueFn;
};

export const useKeyValueFieldManager = <
  TFormData extends FieldValues,
  TName extends FieldArrayPath<TFormData>,
  T extends KeyValueField = PathValue<TFormData, TName>[number],
>(
  options: KeyValueFieldManagerOptions<TFormData, TName>,
): UseKeyValueFieldManagerReturn<TFormData, TName> => {
  const {
    fieldArray,
    name,
    defaultValue,
    isEmpty: customIsEmpty,
    shouldSetActive: customShouldSetActive,
  } = options;
  const {
    setValue: internalSetValue,
    watch,
    setFocus,
    register,
  } = useFormContext();

  const watchedFields = watch(name) as T[];
  const prevLengthRef = useRef(-1);
  const lastEditedIndexRef = useRef<number>(-1);
  const { fields, append, remove } = fieldArray;

  const setValue = useCallback<SetValueFn>(
    (index, field, value, options?) => {
      if (field === "value" || field === "name") {
        lastEditedIndexRef.current = index;
      }

      // biome-ignore lint/suspicious/noExplicitAny: Hard to type this properly with the generic type
      internalSetValue(`${name}.${index}.${field}` as any, value);

      if (options?.focus === "next") {
        setFocus(
          field === "name"
            ? `${name}.${index}.value`
            : `${name}.${index + 1}.name`,
        );
      } else if (options?.focus === "previous") {
        setFocus(
          field === "name"
            ? `${name}.${index - 1}.value`
            : `${name}.${index}.name`,
        );
      }
    },
    [name, internalSetValue, setFocus],
  );

  const isEmpty = useCallback(
    (item: T) => {
      if (customIsEmpty) return customIsEmpty(item);
      return !item.name && !item.value;
    },
    [customIsEmpty],
  );

  const shouldSetActive = useCallback(
    (item: T) => {
      if (customShouldSetActive) return customShouldSetActive(item);
      return Boolean(item.name || item.value);
    },
    [customShouldSetActive],
  );

  // Auto-append, auto-remove, and ensure at least one field
  useEffect(() => {
    if (!watchedFields) return;

    // Prevents double-appending in Strict Mode
    if (prevLengthRef.current === -1) {
      prevLengthRef.current = watchedFields.length;

      if (watchedFields.length === 0) {
        // biome-ignore lint/suspicious/noExplicitAny: Hard to type this properly with the generic type
        append(defaultValue as any, { shouldFocus: false });
      }
      return;
    }

    prevLengthRef.current = watchedFields.length;

    // If no fields, append one
    if (watchedFields.length === 0) {
      // biome-ignore lint/suspicious/noExplicitAny: Hard to type this properly with the generic type
      append(defaultValue as any, { shouldFocus: false });
      return;
    }

    // Auto-remove empty fields (except the last one, keep at least one)
    if (watchedFields.length > 1) {
      const emptyIndices: number[] = [];

      // Check all fields except the last one
      for (let i = 0; i < watchedFields.length - 1; i++) {
        const field = watchedFields[i];
        if (field && isEmpty(field) && !shouldSetActive(field)) {
          emptyIndices.push(i);
        }
      }

      // Remove from highest index to lowest to avoid index shifting
      if (emptyIndices.length > 0) {
        const lowestRemovedIndex = emptyIndices[0];

        if (lowestRemovedIndex === undefined) return;

        for (let i = emptyIndices.length - 1; i >= 0; i--) {
          remove(emptyIndices[i]);
        }

        // If we just edited this field, focus the previous row's value
        if (lastEditedIndexRef.current === lowestRemovedIndex) {
          if (lowestRemovedIndex > 0) {
            setFocus(`${name}.${lowestRemovedIndex - 1}.value`);
          } else if (watchedFields.length > 1) {
            // If we removed index 0, focus the new row 0's name
            setFocus(`${name}.0.name`);
          }
        }
        lastEditedIndexRef.current = -1;
      }
    }

    // If last field has content, append empty one
    const lastField = watchedFields[watchedFields.length - 1];
    if (lastField && !isEmpty(lastField)) {
      // biome-ignore lint/suspicious/noExplicitAny: Hard to type this properly with the generic type
      append(defaultValue as any, { shouldFocus: false });
    }
  }, [
    watchedFields,
    append,
    remove,
    defaultValue,
    isEmpty,
    name,
    setFocus,
    shouldSetActive,
  ]);

  // Auto-update active state based on field content
  useEffect(() => {
    if (!watchedFields) return;

    watchedFields.forEach((field, index) => {
      const shouldBeActive = shouldSetActive(field);
      if (field.active !== shouldBeActive) {
        setValue(index, "active", shouldBeActive);
      }
    });
  }, [watchedFields, shouldSetActive, setValue]);

  const isFieldEmpty = useCallback(
    (index: number) => {
      const field = watchedFields?.[index];
      return field ? isEmpty(field) : true;
    },
    [watchedFields, isEmpty],
  );

  const getNameInputProps = useCallback(
    (index: number) => ({
      ...register(`${name}.${index}.name`),
      onChange: (e: ChangeEvent<HTMLInputElement>) =>
        setValue(index, "name", e.target.value),
      onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          setFocus(`${name}.${index}.value`);
        } else if (
          e.key === "Backspace" &&
          e.target instanceof HTMLInputElement &&
          !e.target.value
        ) {
          setFocus(`${name}.${index - 1}.value`);
        }
      },
    }),
    [register, setFocus, name, setValue],
  );

  const getValueInputProps = useCallback(
    (index: number) => ({
      ...register(`${name}.${index}.value`),
      onChange: (e: ChangeEvent<HTMLInputElement>) =>
        setValue(index, "value", e.target.value),
      onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          setFocus(`${name}.${index + 1}.name`);
        } else if (
          e.key === "Backspace" &&
          e.target instanceof HTMLInputElement &&
          !e.target.value
        ) {
          setFocus(`${name}.${index}.name`);
        }
      },
    }),
    [register, setFocus, name, setValue],
  );

  const getCheckboxProps = useCallback(
    (index: number) =>
      ({
        ...register(`${name}.${index}.active`),
        checked: watch(`${name}.${index}.active`) ?? false,
        disabled: isFieldEmpty(index),
        onCheckedChange: (checked: boolean) => {
          setValue(index, "active", checked === true);
        },
      }) satisfies CheckboxProps,
    [name, register, isFieldEmpty, watch, setValue],
  );

  const getValue = useCallback<GetValueFn>(
    (index, field) => watchedFields?.[index]?.[field],
    [watchedFields],
  );

  const getRemoveButtonProps = useCallback(
    (index: number) => ({
      onClick: () => remove(index),
      disabled: index === fields.length - 1,
    }),
    [remove, fields.length],
  );

  return {
    fields,
    getNameInputProps,
    getValueInputProps,
    getCheckboxProps,
    getRemoveButtonProps,
    setValue,
    getValue,
  };
};
