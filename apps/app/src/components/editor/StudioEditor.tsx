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
import React, { useEffect, useRef, useMemo } from "react";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { type EditorProps, editorExtensions } from "./EditorBase";
import { sitecueTheme } from "./sitecueTheme";

// propsに onGenerateHint を追加
interface StudioEditorProps extends EditorProps {
	onGenerateHint?: (
		context: string,
		isExplicit?: boolean,
	) => Promise<string | null>;
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

// ★ ポイント1: basicSetup のオブジェクトをコンポーネントの外に出し、参照を完全に固定する
const basicSetupConfig = {
	lineNumbers: false,
	foldGutter: false,
};

export const StudioEditor = ({
	value,
	onChange,
	placeholder,
	isDirty = false,
	onGenerateHint,
}: StudioEditorProps) => {
	useUnsavedChanges(isDirty);

	// 最新の onGenerateHint 関数を常に保持する
	const onGenerateHintRef = useRef(onGenerateHint);
	useEffect(() => {
		onGenerateHintRef.current = onGenerateHint;
	}, [onGenerateHint]);

	// ★ ポイント2: 依存配列を「完全に空」にして、拡張機能自体は一度しか作られないようにする
	const hintExtension = useMemo(() => {
		const requestHint = (view: EditorView) => {
			// 実行時にRefの中身を確認する（拡張機能自体を作り直す必要はない）
			if (!onGenerateHintRef.current) return false;

			const pos = view.state.selection.main.head;
			const textBefore = view.state.sliceDoc(Math.max(0, pos - 500), pos);
			const initialDocLength = view.state.doc.length;

			onGenerateHintRef.current(textBefore, true).then((hintText) => {
				if (hintText && view.state.doc.length === initialDocLength) {
					view.dispatch({
						effects: [
							setHintEffect.of({
								pos: view.state.selection.main.head,
								text: hintText,
							}),
						],
					});
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
	}, []);

	// すべての extensions を一つの安定した配列にまとめる
	const extensions = React.useMemo(
		() => [
			...editorExtensions,
			// sitecueTheme が配列の場合はスプレッド展開する（一貫性のため）
			...(Array.isArray(sitecueTheme) ? sitecueTheme : [sitecueTheme]),
			...hintExtension,
		],
		[hintExtension],
	);

	return (
		<div className="w-full rounded-xl bg-base-surface/50 focus-within:bg-base-bg focus-within:shadow-sm border border-transparent focus-within:border-base-border transition-all duration-200 p-6">
			<CodeMirror
				value={value}
				onChange={onChange}
				extensions={extensions}
				placeholder={placeholder}
				basicSetup={basicSetupConfig}
				className="text-base"
				theme="light"
			/>
		</div>
	);
};
