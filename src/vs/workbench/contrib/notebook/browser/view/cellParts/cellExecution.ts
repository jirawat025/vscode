/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as DOM from 'vs/base/browser/dom';
import { DisposableStore } from 'vs/base/common/lifecycle';
import { ICellViewModel, INotebookEditorDelegate } from 'vs/workbench/contrib/notebook/browser/notebookBrowser';
import { CellViewModelStateChangeEvent } from 'vs/workbench/contrib/notebook/browser/notebookViewEvents';
import { CellPart } from 'vs/workbench/contrib/notebook/browser/view/cellParts/cellPart';
import { BaseCellRenderTemplate } from 'vs/workbench/contrib/notebook/browser/view/notebookRenderingCommon';
import { NotebookCellInternalMetadata } from 'vs/workbench/contrib/notebook/common/notebookCommon';

export class CellExecutionPart extends CellPart {
	private kernelDisposables = new DisposableStore();

	constructor(
		private readonly _notebookEditor: INotebookEditorDelegate,
		private readonly _executionOrderLabel: HTMLElement
	) {
		super();
	}

	setup(templateData: BaseCellRenderTemplate): void {
		this._register(this._notebookEditor.onDidChangeActiveKernel(() => {
			if (templateData.currentRenderedCell) {
				this.kernelDisposables.clear();

				if (this._notebookEditor.activeKernel) {
					this.kernelDisposables.add(this._notebookEditor.activeKernel.onDidChange(() => {
						if (templateData.currentRenderedCell) {
							this.updateExecutionOrder(templateData.currentRenderedCell.internalMetadata);
						}
					}));
				}

				this.updateExecutionOrder(templateData.currentRenderedCell.internalMetadata);
			}
		}));
	}

	renderCell(element: ICellViewModel, _templateData: BaseCellRenderTemplate): void {
		this.updateExecutionOrder(element.internalMetadata);
	}

	private updateExecutionOrder(internalMetadata: NotebookCellInternalMetadata): void {
		if (this._notebookEditor.activeKernel?.implementsExecutionOrder) {
			const executionOrderLabel = typeof internalMetadata.executionOrder === 'number' ?
				`[${internalMetadata.executionOrder}]` :
				'[ ]';
			this._executionOrderLabel.innerText = executionOrderLabel;
		} else {
			this._executionOrderLabel.innerText = '';
		}
	}

	updateState(element: ICellViewModel, e: CellViewModelStateChangeEvent): void {
		if (e.internalMetadataChanged) {
			this.updateExecutionOrder(element.internalMetadata);
		}
	}

	updateInternalLayoutNow(element: ICellViewModel): void {
		if (element.isInputCollapsed) {
			DOM.hide(this._executionOrderLabel);
		} else {
			DOM.show(this._executionOrderLabel);
		}
	}

	prepareLayout(): void { }
}
