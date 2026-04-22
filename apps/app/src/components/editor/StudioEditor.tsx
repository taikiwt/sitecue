"use client";
import {
	Prec,
	type StateCommand,
	StateEffect,
	StateField,
} from "@codemirror/state";
import {
	Decoration,
	type DecorationSet,
	EditorView,
	keymap,
	WidgetType,
} from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import React from "react";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { type EditorProps, editorExtensions } from "./EditorBase";
import { sitecueTheme } from "./sitecueTheme";

// propsに onGenerateHint を追加
interface StudioEditorProps extends EditorProps {
	onGenerateHint?: (context: string) => Promise<string | null>;
}

// --- CM6 Hint Extension ---
const setHintEffect = StateEffect.define<{
	pos: number;
	text: string;
} | null>();

class HintWidget extends WidgetType {
	constructor(public text: string) {
		super();
	}
	toDOM() {
		const span = document.createElement("span");
		span.textContent = this.text;
		span.className = "text-neutral-400 italic pointer-events-none opacity-60";
		return span;
	}
}

const hintField = StateField.define<DecorationSet>({
	create: () => Decoration.none,
	update: (hints, tr) => {
		const nextHints = hints.map(tr.changes);
		for (const e of tr.effects) {
			if (e.is(setHintEffect)) {
				if (e.value === null) return Decoration.none;
				return Decoration.set([
					Decoration.widget({
						widget: new HintWidget(e.value.text),
						side: 1,
					}).range(e.value.pos),
				]);
			}
		}
		if (tr.docChanged) return Decoration.none; // ユーザーが入力したらヒントを消す
		return nextHints;
	},
	provide: (f) => EditorView.decorations.from(f),
});

export const StudioEditor = ({
	value,
	onChange,
	placeholder,
	isDirty = false,
	onGenerateHint,
}: StudioEditorProps) => {
	useUnsavedChanges(isDirty);

	// Keymap拡張を定義
	const hintExtension = React.useMemo(() => {
		if (!onGenerateHint) return [];

		const requestHint: StateCommand = ({ state, dispatch }) => {
			const pos = state.selection.main.head;
			const textBefore = state.sliceDoc(Math.max(0, pos - 500), pos);

			onGenerateHint(textBefore).then((hintText) => {
				if (hintText) {
					dispatch(
						state.update({
							effects: [setHintEffect.of({ pos, text: hintText })],
						}),
					);
				}
			});
			return true;
		};

		const acceptHint: StateCommand = ({ state, dispatch }) => {
			const activeHints = state.field(hintField, false);
			if (!activeHints) return false;

			let accepted = false;
			activeHints.between(
				state.selection.main.head,
				state.selection.main.head,
				(from, _to, value) => {
					const widget = value.spec.widget as HintWidget;
					if (widget?.text) {
						dispatch(
							state.update({
								changes: { from, insert: widget.text },
								effects: [setHintEffect.of(null)],
							}),
						);
						accepted = true;
					}
				},
			);
			return accepted;
		};

		return [
			hintField,
			Prec.highest(
				keymap.of([
					{ key: "Mod-j", run: requestHint, preventDefault: true },
					{ key: "Alt-j", run: requestHint, preventDefault: true }, // Windows Fallback
					{ key: "Tab", run: acceptHint }, // Tabでヒントを受け入れる
					{
						key: "Escape",
						run: ({ state, dispatch }) => {
							dispatch(state.update({ effects: [setHintEffect.of(null)] }));
							return true;
						},
					},
				]),
			),
		];
	}, [onGenerateHint]);

	return (
		<div className="w-full rounded-xl bg-base-surface/50 focus-within:bg-base-bg focus-within:shadow-sm border border-transparent focus-within:border-base-border transition-all duration-200 p-6">
			<CodeMirror
				value={value}
				onChange={onChange}
				extensions={[...editorExtensions, sitecueTheme, ...hintExtension]}
				placeholder={placeholder}
				basicSetup={{
					lineNumbers: false,
					foldGutter: false,
				}}
				className="text-base"
				theme="light"
			/>
		</div>
	);
};
