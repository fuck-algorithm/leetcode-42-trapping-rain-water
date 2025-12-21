/**
 * Property-Based Tests for Data Structure Rendering
 * 
 * **Feature: advanced-canvas-visualization, Property 4: Data Structure Rendering Completeness**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * Property: For any data structure (binary tree, array, HashMap, stack, graph),
 * all elements in the data structure should have corresponding visual representations.
 */

import fc from 'fast-check';
import {
  createArrayElements,
  calculateArrayWidth,
  ArrayElement,
} from '../../components/canvas/renderers/ArrayRenderer';
import {
  createStackItems,
  calculateStackHeight,
  StackItem,
} from '../../components/canvas/renderers/StackRenderer';
import {
  createHashMapEntries,
  HashMapEntry,
} from '../../components/canvas/renderers/HashMapRenderer';
import {
  createBinaryTreeFromArray,
  TreeNode,
} from '../../components/canvas/renderers/BinaryTreeRenderer';
import {
  createGraphFromAdjacencyList,
  GraphNode,
  GraphEdge,
} from '../../components/canvas/renderers/GraphRenderer';

/**
 * 计算二叉树中的节点数量
 */
function countTreeNodes(root: TreeNode | null): number {
  if (!root) return 0;
  return 1 + countTreeNodes(root.left || null) + countTreeNodes(root.right || null);
}

/**
 * 收集二叉树中所有节点的值
 */
function collectTreeValues(root: TreeNode | null): any[] {
  if (!root) return [];
  return [
    root.value,
    ...collectTreeValues(root.left || null),
    ...collectTreeValues(root.right || null),
  ];
}

describe('Data Structure Rendering Properties', () => {
  /**
   * **Feature: advanced-canvas-visualization, Property 4: Data Structure Rendering Completeness**
   * **Validates: Requirements 3.2**
   * 
   * Array Rendering: All array elements should be represented
   */
  describe('Array Rendering Completeness', () => {
    it('should create ArrayElement for each value in the array', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: -1000, max: 1000 }), { minLength: 0, maxLength: 50 }),
          (values) => {
            const elements = createArrayElements(values);
            
            // 元素数量应该与输入数组长度相同
            return elements.length === values.length;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should preserve all values in ArrayElements', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: -1000, max: 1000 }), { minLength: 1, maxLength: 50 }),
          (values) => {
            const elements = createArrayElements(values);
            
            // 每个元素的值应该与原数组对应位置的值相同
            return elements.every((el, i) => el.value === values[i] && el.index === i);
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should correctly apply highlighting to specified indices', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 5, maxLength: 20 }),
          fc.array(fc.integer({ min: 0, max: 4 }), { minLength: 0, maxLength: 3 }),
          (values, highlightIndices) => {
            const elements = createArrayElements(values, highlightIndices);
            
            // 高亮的元素应该正确标记
            return elements.every((el) => {
              const shouldBeHighlighted = highlightIndices.includes(el.index);
              return el.highlighted === shouldBeHighlighted;
            });
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should calculate correct array width', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 20, max: 80 }),
          fc.integer({ min: 1, max: 10 }),
          (count, cellWidth, spacing) => {
            const width = calculateArrayWidth(count, cellWidth, spacing);
            const expectedWidth = count * cellWidth + (count - 1) * spacing;
            
            return width === expectedWidth;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });
  });

  /**
   * **Feature: advanced-canvas-visualization, Property 4: Data Structure Rendering Completeness**
   * **Validates: Requirements 3.4**
   * 
   * Stack Rendering: All stack items should be represented
   */
  describe('Stack Rendering Completeness', () => {
    it('should create StackItem for each value in the stack', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: -1000, max: 1000 }), { minLength: 0, maxLength: 30 }),
          (values) => {
            const items = createStackItems(values);
            
            // 元素数量应该与输入数组长度相同
            return items.length === values.length;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should preserve all values in StackItems', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: -1000, max: 1000 }), { minLength: 1, maxLength: 30 }),
          (values) => {
            const items = createStackItems(values);
            
            // 每个元素的值应该与原数组对应位置的值相同
            return items.every((item, i) => item.value === values[i]);
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should assign unique IDs to each stack item', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 2, maxLength: 30 }),
          (values) => {
            const items = createStackItems(values);
            const ids = items.map(item => item.id);
            const uniqueIds = new Set(ids);
            
            // 所有 ID 应该唯一
            return uniqueIds.size === items.length;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });
  });

  /**
   * **Feature: advanced-canvas-visualization, Property 4: Data Structure Rendering Completeness**
   * **Validates: Requirements 3.3**
   * 
   * HashMap Rendering: All key-value pairs should be represented
   */
  describe('HashMap Rendering Completeness', () => {
    it('should create HashMapEntry for each key-value pair', () => {
      fc.assert(
        fc.property(
          fc.dictionary(
            fc.string({ minLength: 1, maxLength: 10 }),
            fc.integer({ min: -1000, max: 1000 })
          ),
          (map) => {
            const entries = createHashMapEntries(map);
            
            // 条目数量应该与输入对象的键数量相同
            return entries.length === Object.keys(map).length;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should preserve all keys and values in HashMapEntries', () => {
      fc.assert(
        fc.property(
          fc.dictionary(
            fc.string({ minLength: 1, maxLength: 10 }),
            fc.integer({ min: -1000, max: 1000 })
          ),
          (map) => {
            const entries = createHashMapEntries(map);
            
            // 每个条目的键值对应该与原对象匹配
            return entries.every(entry => map[entry.key] === entry.value);
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should correctly apply highlighting to specified keys', () => {
      fc.assert(
        fc.property(
          fc.dictionary(
            fc.constantFrom('a', 'b', 'c', 'd', 'e'),
            fc.integer({ min: 0, max: 100 })
          ),
          fc.array(fc.constantFrom('a', 'b', 'c'), { minLength: 0, maxLength: 2 }),
          (map, highlightKeys) => {
            const entries = createHashMapEntries(map, highlightKeys);
            
            // 高亮的条目应该正确标记
            return entries.every(entry => {
              const shouldBeHighlighted = (highlightKeys as string[]).includes(entry.key);
              return entry.highlighted === shouldBeHighlighted;
            });
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });
  });

  /**
   * **Feature: advanced-canvas-visualization, Property 4: Data Structure Rendering Completeness**
   * **Validates: Requirements 3.1**
   * 
   * Binary Tree Rendering: All tree nodes should be represented
   */
  describe('Binary Tree Rendering Completeness', () => {
    it('should create TreeNode for each reachable non-null value in level-order array', () => {
      fc.assert(
        fc.property(
          // 生成有效的完全二叉树层序数组（避免 null 导致的不可达节点）
          fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 15 }),
          (values) => {
            const root = createBinaryTreeFromArray(values);
            const nodeCount = countTreeNodes(root);
            
            // 对于完全二叉树（无 null），节点数量应该等于数组长度
            return nodeCount === values.length;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should preserve all values in tree nodes', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 7 }),
          (values) => {
            const root = createBinaryTreeFromArray(values);
            const treeValues = collectTreeValues(root);
            
            // 树中的值应该包含所有输入值
            return values.every(v => treeValues.includes(v));
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should handle empty tree correctly', () => {
      const root = createBinaryTreeFromArray([]);
      expect(root).toBeNull();
    });

    it('should handle single node tree correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          (value) => {
            const root = createBinaryTreeFromArray([value]);
            
            return (
              root !== null &&
              root.value === value &&
              root.left === undefined &&
              root.right === undefined
            );
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });
  });

  /**
   * **Feature: advanced-canvas-visualization, Property 4: Data Structure Rendering Completeness**
   * **Validates: Requirements 3.5**
   * 
   * Graph Rendering: All nodes and edges should be represented
   */
  describe('Graph Rendering Completeness', () => {
    it('should create GraphNode for each key in adjacency list', () => {
      fc.assert(
        fc.property(
          fc.dictionary(
            fc.constantFrom('A', 'B', 'C', 'D', 'E'),
            fc.array(fc.constantFrom('A', 'B', 'C', 'D', 'E'), { minLength: 0, maxLength: 3 })
          ),
          (adjacencyList) => {
            const { nodes } = createGraphFromAdjacencyList(adjacencyList);
            
            // 节点数量应该等于邻接表的键数量
            return nodes.length === Object.keys(adjacencyList).length;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should create edges for all unique connections in adjacency list', () => {
      fc.assert(
        fc.property(
          fc.dictionary(
            fc.constantFrom('A', 'B', 'C'),
            fc.array(fc.constantFrom('A', 'B', 'C'), { minLength: 0, maxLength: 2 })
          ),
          (adjacencyList) => {
            const { edges } = createGraphFromAdjacencyList(adjacencyList, undefined, [], [], true);
            
            // 计算邻接表中的唯一边数（有向图）
            const uniqueEdges = new Set<string>();
            Object.entries(adjacencyList).forEach(([source, targets]) => {
              targets.forEach(target => {
                uniqueEdges.add(`${source}-${target}`);
              });
            });
            
            // 边数应该匹配唯一边数
            return edges.length === uniqueEdges.size;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should correctly apply highlighting to specified nodes', () => {
      fc.assert(
        fc.property(
          fc.dictionary(
            fc.constantFrom('A', 'B', 'C', 'D'),
            fc.array(fc.constantFrom('A', 'B', 'C', 'D'), { minLength: 0, maxLength: 2 })
          ),
          fc.array(fc.constantFrom('A', 'B'), { minLength: 0, maxLength: 2 }),
          (adjacencyList, highlightNodes) => {
            const { nodes } = createGraphFromAdjacencyList(
              adjacencyList,
              undefined,
              highlightNodes
            );
            
            // 高亮的节点应该正确标记
            return nodes.every(node => {
              const shouldBeHighlighted = (highlightNodes as string[]).includes(node.id);
              return node.highlighted === shouldBeHighlighted;
            });
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });

    it('should assign unique IDs to each node', () => {
      fc.assert(
        fc.property(
          fc.dictionary(
            fc.constantFrom('A', 'B', 'C', 'D', 'E'),
            fc.array(fc.constantFrom('A', 'B', 'C', 'D', 'E'), { minLength: 0, maxLength: 2 })
          ),
          (adjacencyList) => {
            const { nodes } = createGraphFromAdjacencyList(adjacencyList);
            const ids = nodes.map(node => node.id);
            const uniqueIds = new Set(ids);
            
            // 所有 ID 应该唯一
            return uniqueIds.size === nodes.length;
          }
        ),
        { numRuns: 100, verbose: true }
      );
    });
  });
});
