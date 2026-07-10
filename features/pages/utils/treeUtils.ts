import { PageComponent } from '../../../types/index';

export const findNodeAndAdd = (rootNode: PageComponent, targetId: string, newNode: PageComponent): PageComponent => {
    if (rootNode.id === targetId) {
        return {
            ...rootNode,
            children: [...(rootNode.children || []), newNode]
        };
    }
    if (rootNode.children) {
        return {
            ...rootNode,
            children: rootNode.children.map(c => findNodeAndAdd(c, targetId, newNode))
        };
    }
    return rootNode;
};

export const findNodeAndUpdateProps = (rootNode: PageComponent, targetId: string, newProps: any): PageComponent => {
    if (rootNode.id === targetId) {
        return {
            ...rootNode,
            props: { ...rootNode.props, ...newProps }
        };
    }
    if (rootNode.children) {
        return {
            ...rootNode,
            children: rootNode.children.map(c => findNodeAndUpdateProps(c, targetId, newProps))
        };
    }
    return rootNode;
};

export const findNodeAndDelete = (rootNode: PageComponent, targetId: string): PageComponent | null => {
    if (rootNode.id === targetId) return null;
    if (rootNode.children) {
        return {
            ...rootNode,
            children: rootNode.children.map(c => findNodeAndDelete(c, targetId)).filter(Boolean) as PageComponent[]
        };
    }
    return rootNode;
};

export const findNode = (rootNode: PageComponent, targetId: string): PageComponent | null => {
    if (rootNode.id === targetId) return rootNode;
    if (rootNode.children) {
        for (const child of rootNode.children) {
             const found = findNode(child, targetId);
             if (found) return found;
        }
    }
    return null;
};
