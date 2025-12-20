// 输入验证工具函数

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  heights?: number[];
}

// 验证规则常量
export const VALIDATION_RULES = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 200,
  MIN_VALUE: 0,
  MAX_VALUE: 10000,
} as const;

/**
 * 验证高度数组输入
 * @param input 逗号分隔的数字字符串
 * @returns 验证结果
 */
export function validateHeights(input: string): ValidationResult {
  // 空输入检查
  if (!input || !input.trim()) {
    return { isValid: false, error: '请输入高度数据' };
  }

  const trimmedInput = input.trim();

  // 格式检查：只允许数字、逗号和空格
  if (!/^[\d,\s]+$/.test(trimmedInput)) {
    return { isValid: false, error: '输入只能包含数字和逗号' };
  }

  // 解析数组
  const parts = trimmedInput.split(',').map(s => s.trim()).filter(s => s !== '');
  
  if (parts.length === 0) {
    return { isValid: false, error: '请输入至少一个数字' };
  }

  // 解析为数字
  const heights: number[] = [];
  for (const part of parts) {
    const num = parseInt(part, 10);
    
    if (isNaN(num)) {
      return { isValid: false, error: `"${part}" 不是有效的数字` };
    }
    
    heights.push(num);
  }

  // 长度检查
  if (heights.length < VALIDATION_RULES.MIN_LENGTH) {
    return { 
      isValid: false, 
      error: `数组长度至少为 ${VALIDATION_RULES.MIN_LENGTH}` 
    };
  }

  if (heights.length > VALIDATION_RULES.MAX_LENGTH) {
    return { 
      isValid: false, 
      error: `数组长度不能超过 ${VALIDATION_RULES.MAX_LENGTH}，当前长度: ${heights.length}` 
    };
  }

  // 值范围检查
  for (let i = 0; i < heights.length; i++) {
    const h = heights[i];
    
    if (h < VALIDATION_RULES.MIN_VALUE) {
      return { 
        isValid: false, 
        error: `位置 ${i} 的值 ${h} 不能为负数` 
      };
    }
    
    if (h > VALIDATION_RULES.MAX_VALUE) {
      return { 
        isValid: false, 
        error: `位置 ${i} 的值 ${h} 超过最大值 ${VALIDATION_RULES.MAX_VALUE}` 
      };
    }
  }

  return { isValid: true, heights };
}

/**
 * 生成随机高度数组
 * @param minLength 最小长度（默认8）
 * @param maxLength 最大长度（默认15）
 * @param maxHeight 最大高度（默认9）
 * @returns 随机高度数组
 */
export function generateRandomHeights(
  minLength: number = 8,
  maxLength: number = 15,
  maxHeight: number = 9
): number[] {
  // 确保参数在有效范围内
  const safeMinLength = Math.max(VALIDATION_RULES.MIN_LENGTH, Math.min(minLength, VALIDATION_RULES.MAX_LENGTH));
  const safeMaxLength = Math.max(safeMinLength, Math.min(maxLength, VALIDATION_RULES.MAX_LENGTH));
  const safeMaxHeight = Math.min(maxHeight, VALIDATION_RULES.MAX_VALUE);

  const length = Math.floor(Math.random() * (safeMaxLength - safeMinLength + 1)) + safeMinLength;
  
  return Array.from({ length }, () => 
    Math.floor(Math.random() * (safeMaxHeight + 1))
  );
}
