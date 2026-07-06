export default class UUID{
  static generate(prefix = 'elem') {
    const arr = new Uint8Array(5); // 5 bytes = 10 hex characters
    crypto.getRandomValues(arr);
    const hex = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
    return `${prefix}-${hex}`; 
    // Output example: "rect-a1b2c3d4e5" or "path-f9e8d7c6b5"
  }
  
  static validate(id) {
    return /^\w+-[0-9a-f]{10}$/.test(id);
  }
}