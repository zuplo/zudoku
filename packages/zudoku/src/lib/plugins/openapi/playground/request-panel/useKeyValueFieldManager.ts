import {
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  startTransition,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type {
  Control,
  FieldArrayPath,
  FieldArrayWithId,
  FieldValues,
  PathValue,
} from "react-hook-form";
import { useFieldArray, useFormContext } from "react-hook-form";

export type Value =
  | string
  | number
  | readonly string[]
  | File
  | boolean
  | undefined;

export type KeyValueField = {
  name: string;
  value: Value;
  active: boolean;
};

export type KeyValueFieldManagerOptions<
  TFormData extends FieldValues,
  TName extends FieldArrayPath<TFormData>,
  T extends KeyValueField = PathValue<TFormData, TName>[number],
> = {
  control: Control<TFormData>;
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
  value: Value,
  options?: { focus?: "next" | "previous" },
) => void;

type GetValueFn = (index: number, field: keyof KeyValueField) => Value;

export type UseKeyValueFieldManagerReturn<TFormData extends FieldValues> = {
  fields: FieldArrayWithId<TFormData>[];
  getNameInputProps: GetInputPropsFn;
  getValueInputProps: GetInputPropsFn;
  getCheckboxProps: (index: number) => CheckboxProps;
  getRemoveButtonProps: (index: number) => RemoveButtonProps;
  setValue: SetValueFn;
  getValue: GetValueFn;
};

type GetInputPropsFn = (index: number) => ComponentPropsWithoutRef<"input">;

export const useKeyValueFieldManager = <
  TFormData extends FieldValues,
  TName extends FieldArrayPath<TFormData>,
  T extends KeyValueField = PathValue<TFormData, TName>[number],
>(
  options: KeyValueFieldManagerOptions<TFormData, TName>,
): UseKeyValueFieldManagerReturn<TFormData> => {
  const {
    control,
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
  const { fields, append, remove } = useFieldArray({ control, name });
  const watchedFields = watch(name) as T[];
  const lastEditedIndexRef = useRef(-1);
  const prevLengthRef = useRef(-1);

  const setValue = useCallback<SetValueFn>(
    (index, field, value, options) => {
      if (field === "value" || field === "name") {
        lastEditedIndexRef.current = index;
      }

      // biome-ignore lint/suspicious/noExplicitAny: Can't infer the type of the value here
      internalSetValue(`${name}.${index}.${field}`, value as any);

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

  // Handle auto append/remove of rows
  useEffect(() => {
    if (!watchedFields) return;

    // Prevents double-appending in Strict Mode
    if (prevLengthRef.current === -1) {
      prevLengthRef.current = watchedFields.length;

      if (watchedFields.length === 0) {
        // biome-ignore lint/suspicious/noExplicitAny: Generic field array type
        append(defaultValue as any, {
          shouldFocus: false,
        });
      }
      return;
    }

    prevLengthRef.current = watchedFields.length;

    // If no fields, append one
    if (watchedFields.length === 0) {
      // biome-ignore lint/suspicious/noExplicitAny: Generic field array type
      append(defaultValue as any, {
        shouldFocus: false,
      });
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
          const indexToRemove = emptyIndices[i];
          if (indexToRemove !== undefined) {
            remove(indexToRemove);
          }
        }

        // If we just edited this field, focus the name field at the same index
        // (which now contains what was the next row), or previous row if needed
        if (lastEditedIndexRef.current === lowestRemovedIndex) {
          const newLength = watchedFields.length - emptyIndices.length;

          if (lowestRemovedIndex < newLength) {
            // Next row moved into this position, focus its name field
            setFocus(`${name}.${lowestRemovedIndex}.name`);
          } else if (lowestRemovedIndex > 0) {
            // Removed row was at the end, focus previous row's name
            setFocus(`${name}.${lowestRemovedIndex - 1}.name`);
          } else {
            setFocus(`${name}.0.name`);
          }
        }
        lastEditedIndexRef.current = -1;
      }
    }

    // If last field has content, append empty one
    const lastField = watchedFields[watchedFields.length - 1];
    if (lastField && !isEmpty(lastField)) {
      // biome-ignore lint/suspicious/noExplicitAny: Generic field array type
      append(defaultValue as any, {
        shouldFocus: false,
      });
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

  // Auto set active state of row checkbox
  useEffect(() => {
    if (!watchedFields) return;

    const updates: Array<() => void> = [];

    for (let i = 0; i < watchedFields.length; i++) {
      const field = watchedFields[i];
      if (!field) continue;

      const shouldBeActive = shouldSetActive(field);
      if (field.active === shouldBeActive) continue;

      updates.push(() => setValue(i, "active", shouldBeActive));
    }

    if (updates.length === 0) return;

    startTransition(() => updates.forEach((update) => update()));
  }, [watchedFields, shouldSetActive, setValue]);

  const isFieldEmpty = useCallback(
    (index: number) => {
      const field = watchedFields?.[index];
      return field ? isEmpty(field) : true;
    },
    [watchedFields, isEmpty],
  );

  const createKeyDownHandler = useCallback(
    (index: number, field: "name" | "value") => {
      const next =
        field === "name"
          ? `${name}.${index}.value`
          : `${name}.${index + 1}.name`;

      const previous =
        field === "name"
          ? `${name}.${index - 1}.value`
          : `${name}.${index}.name`;
      const canNavigatePrevious = field === "value" || index > 0;

      return (e: KeyboardEvent<HTMLInputElement>) => {
        if (!(e.target instanceof HTMLInputElement)) return;

        const isAtStart = e.target.selectionStart === 0;
        const isAtEnd = e.target.selectionStart === e.target.value.length;
        const isEmpty = !e.target.value;

        if (e.key === "Enter") {
          setFocus(next);
        } else if (e.key === "Backspace" && isEmpty && canNavigatePrevious) {
          e.preventDefault();
          setFocus(previous);
        } else if (e.key === "ArrowLeft" && isAtStart && canNavigatePrevious) {
          e.preventDefault();
          setFocus(previous);
        } else if (e.key === "ArrowRight" && isAtEnd) {
          e.preventDefault();
          setFocus(next);
        }
      };
    },
    [name, setFocus],
  );

  const getNameInputProps = useCallback<GetInputPropsFn>(
    (index) => ({
      ...register(`${name}.${index}.name`),
      onChange: (e) => setValue(index, "name", e.target.value),
      onKeyDown: createKeyDownHandler(index, "name"),
    }),
    [register, name, setValue, createKeyDownHandler],
  );

  const getValueInputProps = useCallback<GetInputPropsFn>(
    (index) => ({
      ...register(`${name}.${index}.value`),
      onChange: (e) => setValue(index, "value", e.target.value),
      onKeyDown: createKeyDownHandler(index, "value"),
    }),
    [register, name, setValue, createKeyDownHandler],
  );

  const getCheckboxProps = useCallback<(index: number) => CheckboxProps>(
    (index) => ({
      ...register(`${name}.${index}.active`),
      checked: watch(`${name}.${index}.active`) ?? false,
      disabled: isFieldEmpty(index),
      onCheckedChange: (checked: boolean) => {
        setValue(index, "active", checked === true);
      },
    }),
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
